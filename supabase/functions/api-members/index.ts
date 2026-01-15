/**
 * API: Members
 * Handles all family member CRUD operations
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

// Action handlers
async function handleGet(userId: string, memberId: string) {
  console.log(`[API] Getting member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  const supabase = createServiceClient();
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

async function handleCreate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] Creating member`);
  
  const { family_id, name } = payload;
  
  if (!family_id) {
    return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
  }
  
  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Member name is required', 400);
  }
  
  if (!await checkFamilyOwnership(userId, family_id as string)) {
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

async function handleUpdate(userId: string, memberId: string, payload: Record<string, unknown>) {
  console.log(`[API] Updating member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  // Remove non-updatable fields
  const { id, family_id, created_at, created_by, action, ...updateData } = payload;
  
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

async function handleDelete(userId: string, memberId: string) {
  console.log(`[API] Deleting member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, familyId)) {
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

async function handleGetMemories(userId: string, memberId: string) {
  console.log(`[API] Getting memories for member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this member', 403);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('member_memories')
    .select('*')
    .eq('member_id', memberId)
    .order('uploaded_at', { ascending: false });
  
  if (error) {
    console.error('[API] Get memories error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data || []);
}

async function handleBatchCreate(userId: string, members: Record<string, unknown>[]) {
  console.log(`[API] Batch creating ${members.length} members`);
  
  if (!members || !Array.isArray(members) || members.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'Members array is required', 400);
  }
  
  // Check ownership for all families
  const familyIds = [...new Set(members.map(m => m.family_id as string))];
  for (const familyId of familyIds) {
    if (!await checkFamilyOwnership(userId, familyId)) {
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

// Batch delete members
async function handleBatchDelete(userId: string, ids: string[]): Promise<Response> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'Member IDs array is required', 400);
  }

  // Check ownership for all members
  for (const id of ids) {
    const familyId = await getMemberFamilyId(id);
    if (!familyId) continue; // Member might already be deleted
    
    const hasAccess = await checkFamilyOwnership(userId, familyId);
    if (!hasAccess) {
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
    
    // Parse request
    const body = await req.json().catch(() => ({}));
    const { action, id, memberId, members, ids, ...payload } = body;
    
    console.log(`[API] Action: ${action}, Method: ${req.method}`);
    
    // Route to handler based on action
    switch (action) {
      case 'get':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleGet(user!.id, id);
        
      case 'create':
        return await handleCreate(user!.id, payload);
        
      case 'update':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleUpdate(user!.id, id, payload);
        
      case 'delete':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleDelete(user!.id, id);
        
      case 'getMemories':
        const memId = memberId || id;
        if (!memId) return errorResponse('VALIDATION_ERROR', 'Member ID is required', 400);
        return await handleGetMemories(user!.id, memId);
        
      case 'batchCreate':
        return await handleBatchCreate(user!.id, members);
        
      case 'batchDelete':
        return await handleBatchDelete(user!.id, ids);
        
      default:
        return errorResponse('BAD_REQUEST', `Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
