/**
 * API: Marriages
 * Handles all marriage CRUD operations
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

// Get marriage's family ID
async function getMarriageFamilyId(marriageId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('marriages')
    .select('family_id')
    .eq('id', marriageId)
    .maybeSingle();
  return data?.family_id || null;
}

// Action handlers
async function handleGet(userId: string, marriageId: string) {
  console.log(`[API] Getting marriage: ${marriageId}`);
  
  const familyId = await getMarriageFamilyId(marriageId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Marriage not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this marriage', 403);
  }
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('marriages')
    .select('*')
    .eq('id', marriageId)
    .single();
  
  if (error) {
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

async function handleCreate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] Creating marriage`);
  
  const { family_id, husband_id, wife_id } = payload;
  
  if (!family_id) {
    return errorResponse('VALIDATION_ERROR', 'Family ID is required', 400);
  }
  
  if (!husband_id) {
    return errorResponse('VALIDATION_ERROR', 'Husband ID is required', 400);
  }
  
  if (!wife_id) {
    return errorResponse('VALIDATION_ERROR', 'Wife ID is required', 400);
  }
  
  if (!await checkFamilyOwnership(userId, family_id as string)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  
  // Check if marriage already exists
  const { data: existing } = await supabase
    .from('marriages')
    .select('id')
    .eq('family_id', family_id)
    .eq('husband_id', husband_id)
    .eq('wife_id', wife_id)
    .maybeSingle();
  
  if (existing) {
    return errorResponse('DUPLICATE_ENTRY', 'This marriage already exists', 409);
  }
  
  const { data, error } = await supabase
    .from('marriages')
    .insert({
      family_id,
      husband_id,
      wife_id,
      marital_status: payload.marital_status || 'married',
      is_active: payload.is_active !== false,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[API] Create error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  // Update spouse_id on both members
  await supabase
    .from('family_tree_members')
    .update({ spouse_id: wife_id, marital_status: payload.marital_status || 'married' })
    .eq('id', husband_id);
  
  await supabase
    .from('family_tree_members')
    .update({ spouse_id: husband_id, marital_status: payload.marital_status || 'married' })
    .eq('id', wife_id);
  
  return successResponse(data, 201);
}

async function handleUpdate(userId: string, marriageId: string, payload: Record<string, unknown>) {
  console.log(`[API] Updating marriage: ${marriageId}`);
  
  const familyId = await getMarriageFamilyId(marriageId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Marriage not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this marriage', 403);
  }
  
  // Remove non-updatable fields
  const { id, family_id, husband_id, wife_id, created_at, action, ...updateData } = payload;
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('marriages')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', marriageId)
    .select()
    .single();
  
  if (error) {
    console.error('[API] Update error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

async function handleDelete(userId: string, marriageId: string) {
  console.log(`[API] Deleting marriage: ${marriageId}`);
  
  const supabase = createServiceClient();
  
  // Get marriage details first
  const { data: marriage } = await supabase
    .from('marriages')
    .select('family_id, husband_id, wife_id')
    .eq('id', marriageId)
    .maybeSingle();
  
  if (!marriage) {
    return errorResponse('NOT_FOUND', 'Marriage not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, marriage.family_id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this marriage', 403);
  }
  
  // Clear spouse_id from both members
  await supabase
    .from('family_tree_members')
    .update({ spouse_id: null })
    .eq('id', marriage.husband_id)
    .eq('spouse_id', marriage.wife_id);
  
  await supabase
    .from('family_tree_members')
    .update({ spouse_id: null })
    .eq('id', marriage.wife_id)
    .eq('spouse_id', marriage.husband_id);
  
  // Delete the marriage
  const { error } = await supabase
    .from('marriages')
    .delete()
    .eq('id', marriageId);
  
  if (error) {
    console.error('[API] Delete error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ deleted: true, id: marriageId });
}

// Batch delete marriages
async function handleBatchDelete(userId: string, ids: string[]): Promise<Response> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'Marriage IDs array is required', 400);
  }

  const supabase = createServiceClient();

  // Check ownership for all marriages
  for (const id of ids) {
    const familyId = await getMarriageFamilyId(id);
    if (!familyId) continue; // Marriage might already be deleted
    
    const hasAccess = await checkFamilyOwnership(userId, familyId);
    if (!hasAccess) {
      return errorResponse('FORBIDDEN', `Access denied for marriage ${id}`, 403);
    }
  }
  
  const { error } = await supabase
    .from('marriages')
    .delete()
    .in('id', ids);
  
  if (error) {
    console.error('[API] Batch delete error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ deleted: true, count: ids.length });
}

// Delete marriage by husband and wife IDs
async function handleDeleteBySpouses(userId: string, husbandId: string, wifeId: string): Promise<Response> {
  console.log(`[API] Deleting marriage by spouses - husband: ${husbandId}, wife: ${wifeId}`);
  
  const supabase = createServiceClient();
  
  // Find the marriage
  const { data: marriage } = await supabase
    .from('marriages')
    .select('id, family_id')
    .eq('husband_id', husbandId)
    .eq('wife_id', wifeId)
    .maybeSingle();
  
  if (!marriage) {
    return errorResponse('NOT_FOUND', 'Marriage not found', 404);
  }
  
  if (!await checkFamilyOwnership(userId, marriage.family_id)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this marriage', 403);
  }
  
  const { error } = await supabase
    .from('marriages')
    .delete()
    .eq('id', marriage.id);
  
  if (error) {
    console.error('[API] Delete by spouses error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse({ deleted: true, id: marriage.id });
}

// Update marriages by spouse ID
async function handleUpdateBySpouseId(
  userId: string, 
  spouseId: string, 
  isWife: boolean, 
  payload: Record<string, unknown>
): Promise<Response> {
  console.log(`[API] Updating marriages by spouse: ${spouseId}, isWife: ${isWife}`);
  
  const supabase = createServiceClient();
  const column = isWife ? 'wife_id' : 'husband_id';
  
  // Get marriages for this spouse
  const { data: marriages } = await supabase
    .from('marriages')
    .select('id, family_id')
    .eq(column, spouseId);
  
  if (!marriages || marriages.length === 0) {
    return errorResponse('NOT_FOUND', 'No marriages found for this spouse', 404);
  }
  
  // Verify ownership
  for (const marriage of marriages) {
    if (!await checkFamilyOwnership(userId, marriage.family_id)) {
      return errorResponse('FORBIDDEN', 'You do not have access to one or more marriages', 403);
    }
  }
  
  // Remove non-updatable fields
  const { action, id, spouse_id, is_wife, family_id, husband_id, wife_id, created_at, ...updateData } = payload;
  
  const { data, error } = await supabase
    .from('marriages')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq(column, spouseId)
    .select();
  
  if (error) {
    console.error('[API] Update by spouse error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
}

// Upsert marriage (create or update based on husband/wife combo)
async function handleUpsert(userId: string, payload: Record<string, unknown>): Promise<Response> {
  console.log(`[API] Upserting marriage`);
  
  const { family_id, husband_id, wife_id } = payload;
  
  if (!family_id || !husband_id || !wife_id) {
    return errorResponse('VALIDATION_ERROR', 'family_id, husband_id, and wife_id are required', 400);
  }
  
  if (!await checkFamilyOwnership(userId, family_id as string)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this family', 403);
  }
  
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('marriages')
    .upsert(
      {
        family_id,
        husband_id,
        wife_id,
        marital_status: payload.marital_status || 'married',
        is_active: payload.is_active !== false,
      },
      { onConflict: 'husband_id,wife_id' }
    )
    .select()
    .single();
  
  if (error) {
    console.error('[API] Upsert error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data);
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
    const { action, id, ids, ...payload } = body;
    
    console.log(`[API] Action: ${action}, Method: ${req.method}`);
    
    // Route to handler based on action
    switch (action) {
      case 'get':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Marriage ID is required', 400);
        return await handleGet(user!.id, id);
        
      case 'create':
        return await handleCreate(user!.id, payload);
        
      case 'update':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Marriage ID is required', 400);
        return await handleUpdate(user!.id, id, payload);
        
      case 'delete':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Marriage ID is required', 400);
        return await handleDelete(user!.id, id);
        
      case 'batchDelete':
        return await handleBatchDelete(user!.id, ids);
        
      case 'deleteBySpouses':
        if (!payload.husband_id || !payload.wife_id) {
          return errorResponse('VALIDATION_ERROR', 'husband_id and wife_id are required', 400);
        }
        return await handleDeleteBySpouses(user!.id, payload.husband_id as string, payload.wife_id as string);
        
      case 'updateBySpouseId':
        if (!payload.spouse_id) {
          return errorResponse('VALIDATION_ERROR', 'spouse_id is required', 400);
        }
        return await handleUpdateBySpouseId(user!.id, payload.spouse_id as string, payload.is_wife as boolean, payload);
        
      case 'upsert':
        return await handleUpsert(user!.id, payload);
        
      default:
        return errorResponse('BAD_REQUEST', `Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
