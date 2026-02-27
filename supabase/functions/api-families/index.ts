/**
 * API: Families (REST)
 * RESTful API for family-related CRUD operations
 * 
 * Endpoints:
 * GET    /api-families              → List all families
 * GET    /api-families?id=xxx       → Get a single family
 * GET    /api-families?id=xxx&include=members    → Get family with members
 * GET    /api-families?id=xxx&include=marriages  → Get family with marriages
 * POST   /api-families              → Create a new family
 * PUT    /api-families?id=xxx       → Update a family
 * DELETE /api-families?id=xxx       → Delete a family
 * POST   /api-families/share-token?id=xxx  → Regenerate share token
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logActivity } from '../_shared/activityLogger.ts';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Response helpers
function successResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status = 400) {
  console.error(`[API Error] ${code}: ${message}`);
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Create Supabase clients
function createUserClient(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Auth helper
async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: errorResponse('UNAUTHORIZED', 'Missing authorization header', 401) };
  }
  
  const supabase = createUserClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401) };
  }
  
  return { user, supabase };
}

// Check family ownership
async function checkOwnership(userId: string, familyId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('creator_id', userId)
    .maybeSingle();
  return !!data;
}

// Check family access (owner OR collaborator)
async function checkAccess(userId: string, familyId: string): Promise<boolean> {
  if (await checkOwnership(userId, familyId)) return true;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('family_collaborators')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// GET handlers
async function handleList(userId: string, includeStats: boolean = false) {
  console.log(`[API] GET - Listing families for user: ${userId}, stats: ${includeStats}`);
  const supabase = createServiceClient();
  
  // Get owned families with optional member counts
  const selectQuery = includeStats 
    ? '*, family_tree_members(count)' 
    : '*';
  
  const { data: owned, error } = await supabase
    .from('families')
    .select(selectQuery)
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[API] List error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }

  // Get collaborated families
  const { data: collabs } = await supabase
    .from('family_collaborators')
    .select('family_id')
    .eq('user_id', userId);

  let collaborated: any[] = [];
  if (collabs && collabs.length > 0) {
    const familyIds = collabs.map(c => c.family_id);
    const { data: collabFamilies } = await supabase
      .from('families')
      .select(selectQuery)
      .in('id', familyIds)
      .order('created_at', { ascending: false });
    collaborated = (collabFamilies || []).map(f => ({ ...f, _role: 'editor' }));
  }

  let allFamilies = [...(owned || []), ...collaborated];

  // If stats requested, enrich with member counts and last activity
  if (includeStats && allFamilies.length > 0) {
    // Extract member counts
    allFamilies = allFamilies.map((f: any) => ({
      ...f,
      member_count: f.family_tree_members?.[0]?.count || 0,
      family_tree_members: undefined, // clean up nested data
    }));

    // Get last activity for all families
    const familyIds = allFamilies.map((f: any) => f.id);
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('family_id, created_at')
      .in('family_id', familyIds)
      .order('created_at', { ascending: false });

    if (activityData) {
      const activityMap: Record<string, string> = {};
      for (const log of activityData) {
        if (!activityMap[log.family_id]) {
          activityMap[log.family_id] = log.created_at;
        }
      }
      allFamilies = allFamilies.map((f: any) => ({
        ...f,
        last_activity_at: activityMap[f.id] || f.updated_at,
      }));
    }
  }
  
  return successResponse(allFamilies);
}

async function handleGet(userId: string, familyId: string, include?: string) {
  console.log(`[API] GET - Getting family: ${familyId}`);
  
  if (!await checkAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }

  const supabase = createServiceClient();
  
    // Handle include parameter for nested resources
    if (include === 'members') {
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });
      
      if (error) {
        return errorResponse('DATABASE_ERROR', error.message, 500);
      }
      return successResponse(data);
    }
    
    if (include === 'marriages') {
      const { data, error } = await supabase
        .from('marriages')
        .select('*')
        .eq('family_id', familyId);
      
      if (error) {
        return errorResponse('DATABASE_ERROR', error.message, 500);
      }
      return successResponse(data);
    }

    if (include === 'activity') {
      const limit = 20;
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        return errorResponse('DATABASE_ERROR', error.message, 500);
      }

      // Fetch actor names from profiles
      const userIds = [...new Set((data || []).map((l: any) => l.user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const serviceClient = createServiceClient();
        const { data: profiles } = await serviceClient
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.user_id] = [p.first_name, p.last_name].filter(Boolean).join(' ');
          }
        }
      }

      const enriched = (data || []).map((log: any) => ({
        ...log,
        actor_name: profileMap[log.user_id] || null,
      }));

      return successResponse(enriched);
    }
  
  // Default: return family
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('NOT_FOUND', 'Family not found', 404);
    }
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

// POST handler
async function handleCreate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] POST - Creating family for user: ${userId}`);
  
  const { name, description } = payload;
  
  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Family name is required', 400);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('families')
    .insert({
      name,
      description: description || null,
      creator_id: userId,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[API] Create error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data, 201);
}

// PUT handler
async function handleUpdate(userId: string, familyId: string, payload: Record<string, unknown>) {
  console.log(`[API] PUT - Updating family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  // Remove non-updatable fields
  const { id, creator_id, created_at, ...updateData } = payload;
  
  const supabase = createServiceClient();

  // If share_password is being set (non-null, non-empty string), hash it server-side
  if (typeof updateData.share_password === 'string' && updateData.share_password.trim()) {
    const { data: hashedPassword, error: hashError } = await supabase
      .rpc('hash_share_password', { plain_password: updateData.share_password.trim() });
    
    if (hashError) {
      console.error('[API] Password hashing error:', hashError);
      return errorResponse('HASH_ERROR', 'Failed to hash password', 500);
    }
    updateData.share_password = hashedPassword;
  }
  // If share_password is explicitly null, allow clearing it
  
  const { data, error } = await supabase
    .from('families')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', familyId)
    .select()
    .single();
  
  if (error) {
    console.error('[API] Update error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

// DELETE handler
async function handleDelete(userId: string, familyId: string) {
  console.log(`[API] DELETE - Deleting family: ${familyId}`);
  
  if (!await checkAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }

  const supabase = createServiceClient();
  
  // Use the RPC function for complete deletion
  const { data, error } = await supabase.rpc('delete_family_complete', {
    family_uuid: familyId,
  });
  
  if (error) {
    console.error('[API] Delete error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ deleted: true, id: familyId });
}

// Special action: Regenerate share token
async function handleRegenerateShareToken(userId: string, familyId: string, expiresInHours: number, userSupabase: any) {
  console.log(`[API] POST - Regenerating share token for family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  // Use the user's client so auth.uid() works inside the DB function
  const { data, error } = await userSupabase.rpc('regenerate_share_token', {
    p_family_id: familyId,
    p_expires_in_hours: expiresInHours,
  });
  
  if (error) {
    console.error('[API] Regenerate token error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data?.[0] || data);
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Authenticate
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;
    const { user } = auth;
    
    // Parse URL and query params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const include = url.searchParams.get('include');
    const action = url.searchParams.get('action');
    const expiresInHours = parseInt(url.searchParams.get('expiresInHours') || '2', 10);
    
    // Parse body for POST/PUT
    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = await req.json().catch(() => ({}));
    }
    
    console.log(`[API] ${req.method} /api-families ${id ? `id=${id}` : ''} ${include ? `include=${include}` : ''}`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        if (id) {
          return await handleGet(user!.id, id, include || undefined);
        }
        const stats = url.searchParams.get('stats') === 'true';
        return await handleList(user!.id, stats);
        
      case 'POST':
        // Special action for share token regeneration
        if (action === 'regenerateShareToken' && id) {
          return await handleRegenerateShareToken(user!.id, id, expiresInHours, auth.supabase);
        }
        return await handleCreate(user!.id, body);
        
      case 'PUT':
      case 'PATCH':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleUpdate(user!.id, id, body);
        
      case 'DELETE':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleDelete(user!.id, id);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
