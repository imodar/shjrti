/**
 * API: Members (REST)
 * RESTful API for family member CRUD operations
 * 
 * Endpoints:
 * GET    /api-members?id=xxx            → Get a single member
 * GET    /api-members?id=xxx&include=memories → Get member with memories
 * POST   /api-members                   → Create a new member
 * POST   /api-members?action=batch      → Batch create members
 * PUT    /api-members?id=xxx            → Update a member
 * DELETE /api-members?id=xxx            → Delete a member
 * DELETE /api-members?action=batch      → Batch delete members (body: { ids: [...] })
 * PUT    /api-members?action=clearParent → Clear parent reference (body: { parent_id, parent_type })
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
async function checkFamilyOwnership(userId: string, familyId: string): Promise<boolean> {
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
async function checkFamilyAccess(userId: string, familyId: string): Promise<boolean> {
  if (await checkFamilyOwnership(userId, familyId)) return true;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('family_collaborators')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// Get member's family ID
async function getMemberFamilyId(memberId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('family_tree_members')
    .select('family_id')
    .eq('id', memberId)
    .maybeSingle();
  return data?.family_id || null;
}

// GET handler
async function handleGet(userId: string, memberId: string, include?: string) {
  console.log(`[API] GET - Getting member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  const supabase = createServiceClient();
  
  // Handle include parameter for memories
  if (include === 'memories') {
    const { data, error } = await supabase
      .from('member_memories')
      .select('*')
      .eq('member_id', memberId)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }
    return successResponse(data || []);
  }
  
  // Default: return member
  const { data, error } = await supabase
    .from('family_tree_members')
    .select('*')
    .eq('id', memberId)
    .single();
  
  if (error) {
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

// POST handler - Create
async function handleCreate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] POST - Creating member`);
  
  const { family_id, name } = payload;
  
  if (!family_id) {
    return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
  }
  
  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Member name is required', 400);
  }
  
  if (!await checkFamilyAccess(userId, family_id as string)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_tree_members')
    .insert({
      ...payload,
      created_by: userId,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[API] Create error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data, 201);
}

// POST handler - Batch Create
async function handleBatchCreate(userId: string, members: Record<string, unknown>[]) {
  console.log(`[API] POST - Batch creating ${members.length} members`);
  
  if (!members || !Array.isArray(members) || members.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'Members array is required', 400);
  }
  
  // Check ownership for all families
  const familyIds = [...new Set(members.map(m => m.family_id as string))];
  for (const familyId of familyIds) {
    if (!await checkFamilyAccess(userId, familyId)) {
      return errorResponse('FORBIDDEN', `You do not have access to family: ${familyId}`, 403);
    }
  }
  
  const supabase = createServiceClient();
  const membersWithCreator = members.map(m => ({ ...m, created_by: userId }));
  
  const { data, error } = await supabase
    .from('family_tree_members')
    .insert(membersWithCreator)
    .select();
  
  if (error) {
    console.error('[API] Batch create error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data, 201);
}

// PUT handler - Update
async function handleUpdate(userId: string, memberId: string, payload: Record<string, unknown>) {
  console.log(`[API] PUT - Updating member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  // Remove non-updatable fields
  const { id, family_id, created_at, created_by, ...updateData } = payload;
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_tree_members')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select()
    .single();
  
  if (error) {
    console.error('[API] Update error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

// PUT handler - Clear Parent Reference
async function handleClearParentReference(
  userId: string, 
  parentId: string, 
  parentType: 'father' | 'mother'
): Promise<Response> {
  console.log(`[API] PUT - Clearing ${parentType} reference for parent: ${parentId}`);
  
  const familyId = await getMemberFamilyId(parentId);
  if (familyId && !await checkFamilyAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  const supabase = createServiceClient();
  const column = parentType === 'father' ? 'father_id' : 'mother_id';
  
  const { data, error } = await supabase
    .from('family_tree_members')
    .update({ [column]: null })
    .eq(column, parentId)
    .select('id');
  
  if (error) {
    console.error('[API] Clear parent reference error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ updated: data?.length || 0 });
}

// DELETE handler - Single
async function handleDelete(userId: string, memberId: string) {
  console.log(`[API] DELETE - Deleting member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  const supabase = createServiceClient();
  
  // First, clear references to this member
  await supabase
    .from('family_tree_members')
    .update({ spouse_id: null })
    .eq('spouse_id', memberId);
  
  await supabase
    .from('family_tree_members')
    .update({ father_id: null })
    .eq('father_id', memberId);
  
  await supabase
    .from('family_tree_members')
    .update({ mother_id: null })
    .eq('mother_id', memberId);
  
  // Delete related marriages
  await supabase
    .from('marriages')
    .delete()
    .or(`husband_id.eq.${memberId},wife_id.eq.${memberId}`);
  
  // Delete member memories
  await supabase
    .from('member_memories')
    .delete()
    .eq('member_id', memberId);
  
  // Delete the member
  const { error } = await supabase
    .from('family_tree_members')
    .delete()
    .eq('id', memberId);
  
  if (error) {
    console.error('[API] Delete error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ deleted: true, id: memberId });
}

// DELETE handler - Batch
async function handleBatchDelete(userId: string, ids: string[]): Promise<Response> {
  console.log(`[API] DELETE - Batch deleting ${ids.length} members`);
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'Member IDs array is required', 400);
  }

  const supabase = createServiceClient();

  // Check ownership for all members
  for (const id of ids) {
    const familyId = await getMemberFamilyId(id);
    if (!familyId) continue;
    
    if (!await checkFamilyAccess(userId, familyId)) {
      return errorResponse('FORBIDDEN', `Access denied for member ${id}`, 403);
    }
  }
  
  const { error } = await supabase
    .from('family_tree_members')
    .delete()
    .in('id', ids);
  
  if (error) {
    console.error('[API] Batch delete error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ deleted: true, count: ids.length });
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
    
    // Parse body for POST/PUT/DELETE
    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
      body = await req.json().catch(() => ({}));
    }
    
    console.log(`[API] ${req.method} /api-members ${id ? `id=${id}` : ''} ${action ? `action=${action}` : ''}`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleGet(user!.id, id, include || undefined);
        
      case 'POST':
        if (action === 'batch') {
          return await handleBatchCreate(user!.id, body.members as Record<string, unknown>[]);
        }
        return await handleCreate(user!.id, body);
        
      case 'PUT':
      case 'PATCH':
        if (action === 'clearParent') {
          if (!body.parent_id || !body.parent_type) {
            return errorResponse('VALIDATION_ERROR', 'parent_id and parent_type are required', 400);
          }
          return await handleClearParentReference(user!.id, body.parent_id as string, body.parent_type as 'father' | 'mother');
        }
        if (!id) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleUpdate(user!.id, id, body);
        
      case 'DELETE':
        if (action === 'batch') {
          return await handleBatchDelete(user!.id, body.ids as string[]);
        }
        if (!id) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleDelete(user!.id, id);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
