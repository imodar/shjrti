/**
 * API: Suggestions (REST)
 * RESTful API for tree edit suggestions CRUD operations
 * 
 * Endpoints:
 * GET    /api-suggestions?familyId=xxx     → List suggestions for a family
 * GET    /api-suggestions?id=xxx           → Get a single suggestion
 * POST   /api-suggestions                  → Create a new suggestion
 * PATCH  /api-suggestions?id=xxx           → Update suggestion status
 * DELETE /api-suggestions?id=xxx           → Delete a suggestion
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

// Check family access (owner or collaborator)
async function checkFamilyAccess(userId: string, familyId: string): Promise<boolean> {
  const supabase = createServiceClient();
  // Check if owner
  const { data: owned } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('creator_id', userId)
    .maybeSingle();
  if (owned) return true;
  // Check if collaborator
  const { data: collab } = await supabase
    .from('family_collaborators')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!collab;
}

// GET handlers
async function handleList(userId: string, familyId: string) {
  console.log(`[API] GET - Listing suggestions for family: ${familyId}`);
  
  if (!await checkFamilyAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('tree_edit_suggestions')
    .select(`
      *,
      family_tree_members (
        name
      )
    `)
    .eq('family_id', familyId)
    .eq('is_email_verified', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[API] List error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  return successResponse(data);
}

async function handleGet(userId: string, suggestionId: string) {
  console.log(`[API] GET - Getting suggestion: ${suggestionId}`);
  
  const supabase = createServiceClient();
  
  // Get suggestion with family info to check ownership
  const { data, error } = await supabase
    .from('tree_edit_suggestions')
    .select(`
      *,
      family_tree_members (
        name
      )
    `)
    .eq('id', suggestionId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('NOT_FOUND', 'Suggestion not found', 404);
    }
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  // Check ownership
  if (!await checkFamilyAccess(userId, data.family_id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this suggestion', 403);
  }
  
  return successResponse(data);
}

// POST handler - Create suggestion (typically called from public form)
async function handleCreate(payload: Record<string, unknown>) {
  console.log(`[API] POST - Creating suggestion`);
  
  const { 
    family_id, 
    member_id, 
    submitter_name, 
    submitter_email, 
    suggestion_type, 
    suggestion_text,
    suggested_changes 
  } = payload;
  
  if (!family_id || !submitter_name || !submitter_email || !suggestion_type || !suggestion_text) {
    return errorResponse('VALIDATION_ERROR', 'Missing required fields', 400);
  }
  
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('tree_edit_suggestions')
    .insert({
      family_id,
      member_id: member_id || null,
      submitter_name,
      submitter_email,
      suggestion_type,
      suggestion_text,
      suggested_changes: suggested_changes || null,
      status: 'pending',
      is_email_verified: false,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[API] Create error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  return successResponse(data, 201);
}

// PATCH handler - Update suggestion status
async function handleUpdate(userId: string, suggestionId: string, payload: Record<string, unknown>) {
  console.log(`[API] PATCH - Updating suggestion: ${suggestionId}`);
  
  const supabase = createServiceClient();
  
  // Get suggestion to check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('tree_edit_suggestions')
    .select('family_id')
    .eq('id', suggestionId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return errorResponse('NOT_FOUND', 'Suggestion not found', 404);
    }
    return errorResponse('DATABASE_ERROR', fetchError.message, 500);
  }
  
  if (!await checkFamilyAccess(userId, existing.family_id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this suggestion', 403);
  }
  
  // Prepare update data
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (payload.status) {
    updateData.status = payload.status;
    updateData.reviewed_by = userId;
    updateData.reviewed_at = new Date().toISOString();
  }
  
  if (payload.admin_notes !== undefined) {
    updateData.admin_notes = payload.admin_notes;
  }
  
  const { data, error } = await supabase
    .from('tree_edit_suggestions')
    .update(updateData)
    .eq('id', suggestionId)
    .select(`
      *,
      family_tree_members (
        name
      )
    `)
    .single();
  
  if (error) {
    console.error('[API] Update error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  return successResponse(data);
}

// DELETE handler
async function handleDelete(userId: string, suggestionId: string) {
  console.log(`[API] DELETE - Deleting suggestion: ${suggestionId}`);
  
  const supabase = createServiceClient();
  
  // Get suggestion to check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('tree_edit_suggestions')
    .select('family_id')
    .eq('id', suggestionId)
    .single();
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return errorResponse('NOT_FOUND', 'Suggestion not found', 404);
    }
    return errorResponse('DATABASE_ERROR', fetchError.message, 500);
  }
  
  if (!await checkFamilyAccess(userId, existing.family_id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this suggestion', 403);
  }
  
  const { error } = await supabase
    .from('tree_edit_suggestions')
    .delete()
    .eq('id', suggestionId);
  
  if (error) {
    console.error('[API] Delete error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  return successResponse({ deleted: true, id: suggestionId });
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse URL and query params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const familyId = url.searchParams.get('familyId');
    
    // Parse body for POST/PATCH
    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      body = await req.json().catch(() => ({}));
    }
    
    console.log(`[API] ${req.method} /api-suggestions ${id ? `id=${id}` : ''} ${familyId ? `familyId=${familyId}` : ''}`);
    
    // POST for creating suggestions can be unauthenticated (public form)
    if (req.method === 'POST') {
      return await handleCreate(body);
    }
    
    // All other methods require authentication
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;
    const { user } = auth;
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        if (id) {
          return await handleGet(user!.id, id);
        }
        if (familyId) {
          return await handleList(user!.id, familyId);
        }
        return errorResponse('VALIDATION_ERROR', 'Either id or familyId is required', 400);
        
      case 'PATCH':
      case 'PUT':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Suggestion ID is required', 400);
        return await handleUpdate(user!.id, id, body);
        
      case 'DELETE':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Suggestion ID is required', 400);
        return await handleDelete(user!.id, id);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error).message || 'An unexpected error occurred', 500);
  }
});
