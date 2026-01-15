/**
 * API: Families
 * Handles all family-related CRUD operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Action handlers
async function handleList(userId: string) {
  console.log(`[API] Listing families for user: ${userId}`);
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[API] List error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

async function handleGet(userId: string, familyId: string) {
  console.log(`[API] Getting family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
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

async function handleCreate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] Creating family for user: ${userId}`);
  
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

async function handleUpdate(userId: string, familyId: string, payload: Record<string, unknown>) {
  console.log(`[API] Updating family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  // Remove non-updatable fields
  const { id, creator_id, created_at, action, ...updateData } = payload;
  
  const supabase = createServiceClient();
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

async function handleDelete(userId: string, familyId: string) {
  console.log(`[API] Deleting family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
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

async function handleGetMembers(userId: string, familyId: string) {
  console.log(`[API] Getting members for family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_tree_members')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('[API] Get members error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

async function handleGetMarriages(userId: string, familyId: string) {
  console.log(`[API] Getting marriages for family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('marriages')
    .select('*')
    .eq('family_id', familyId);
  
  if (error) {
    console.error('[API] Get marriages error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

async function handleRegenerateShareToken(userId: string, familyId: string, expiresInHours: number) {
  console.log(`[API] Regenerating share token for family: ${familyId}`);
  
  if (!await checkOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('regenerate_share_token', {
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
    
    // Parse request
    const body = await req.json().catch(() => ({}));
    const { action, id, familyId, expiresInHours, ...payload } = body;
    
    console.log(`[API] Action: ${action}, Method: ${req.method}`);
    
    // Route to handler based on action
    switch (action) {
      case 'list':
        return await handleList(user!.id);
        
      case 'get':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleGet(user!.id, id);
        
      case 'create':
        return await handleCreate(user!.id, payload);
        
      case 'update':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleUpdate(user!.id, id, payload);
        
      case 'delete':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleDelete(user!.id, id);
        
      case 'getMembers':
        if (!familyId) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleGetMembers(user!.id, familyId);
        
      case 'getMarriages':
        if (!familyId) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleGetMarriages(user!.id, familyId);
        
      case 'regenerateShareToken':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
        return await handleRegenerateShareToken(user!.id, id, expiresInHours || 2);
        
      default:
        return errorResponse('BAD_REQUEST', `Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
