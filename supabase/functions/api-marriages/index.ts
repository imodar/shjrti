/**
 * API: Marriages (REST)
 * RESTful API for marriage CRUD operations
 * 
 * Endpoints:
 * GET    /api-marriages?id=xxx                 → Get a single marriage
 * POST   /api-marriages                        → Create a new marriage
 * POST   /api-marriages?action=upsert          → Upsert marriage (create or update)
 * PUT    /api-marriages?id=xxx                 → Update a marriage
 * PUT    /api-marriages?action=bySpouse        → Update by spouse ID (body: { spouse_id, is_wife, ...data })
 * DELETE /api-marriages?id=xxx                 → Delete a marriage
 * DELETE /api-marriages?action=batch           → Batch delete (body: { ids: [...] })
 * DELETE /api-marriages?action=bySpouses       → Delete by spouses (body: { husband_id, wife_id })
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logActivity } from '../_shared/activityLogger.ts';

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
async function checkAccess(userId: string, familyId: string): Promise<boolean> {
  const supabase = createServiceClient();
  // Check owner
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('creator_id', userId)
    .maybeSingle();
  if (family) return true;
  // Check collaborator
  const { data: collab } = await supabase
    .from('family_collaborators')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!collab;
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

// GET handler
async function handleGet(userId: string, marriageId: string) {
  console.log(`[API] GET - Getting marriage: ${marriageId}`);
  
  const familyId = await getMarriageFamilyId(marriageId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Marriage not found', 404);
  }
  
   if (!await checkAccess(userId, familyId)) {
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

// POST handler - Create
async function handleCreate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] POST - Creating marriage`);
  
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
  
  if (!await checkAccess(userId, family_id as string)) {
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
    
    // Log activity (non-blocking)
    logActivity({
      familyId: family_id as string,
      userId,
      actionType: 'marriage_added',
      metadata: { marriage_id: data.id, husband_id, wife_id },
    });
    
    return successResponse(data, 201);
}

// POST handler - Upsert
async function handleUpsert(userId: string, payload: Record<string, unknown>): Promise<Response> {
  console.log(`[API] POST - Upserting marriage`);
  
  const { family_id, husband_id, wife_id } = payload;
  
  if (!family_id || !husband_id || !wife_id) {
    return errorResponse('VALIDATION_ERROR', 'family_id, husband_id, and wife_id are required', 400);
  }
  
  if (!await checkAccess(userId, family_id as string)) {
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

// PUT handler - Update
async function handleUpdate(userId: string, marriageId: string, payload: Record<string, unknown>) {
  console.log(`[API] PUT - Updating marriage: ${marriageId}`);
  
  const familyId = await getMarriageFamilyId(marriageId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Marriage not found', 404);
  }
  
  if (!await checkAccess(userId, familyId)) {
    return errorResponse('FORBIDDEN', 'You do not have access to this marriage', 403);
  }
  
  // Remove non-updatable fields
  const { id, family_id, husband_id, wife_id, created_at, ...updateData } = payload;
  
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

// PUT handler - Update by Spouse
async function handleUpdateBySpouse(
  userId: string, 
  spouseId: string, 
  isWife: boolean, 
  payload: Record<string, unknown>
): Promise<Response> {
  console.log(`[API] PUT - Updating marriages by spouse: ${spouseId}, isWife: ${isWife}`);
  
  const supabase = createServiceClient();
  const column = isWife ? 'wife_id' : 'husband_id';
  
  // Get marriages for this spouse
  const { data: marriages } = await supabase
    .from('marriages')
    .select('id, family_id')
    .eq(column, spouseId);
  
  // If no marriages found, return empty array (not an error)
  if (!marriages || marriages.length === 0) {
    return successResponse([]);
  }
  
  // Verify ownership
  for (const marriage of marriages) {
    if (!await checkAccess(userId, marriage.family_id)) {
      return errorResponse('FORBIDDEN', 'You do not have access to one or more marriages', 403);
    }
  }
  
  // Remove non-updatable fields
  const { id, spouse_id, is_wife, family_id, husband_id, wife_id, created_at, ...updateData } = payload;
  
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

// DELETE handler - Single
async function handleDelete(userId: string, marriageId: string) {
  console.log(`[API] DELETE - Deleting marriage: ${marriageId}`);
  
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
  
  if (!await checkAccess(userId, marriage.family_id)) {
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

// DELETE handler - Batch
async function handleBatchDelete(userId: string, ids: string[]): Promise<Response> {
  console.log(`[API] DELETE - Batch deleting ${ids.length} marriages`);
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse('VALIDATION_ERROR', 'Marriage IDs array is required', 400);
  }

  const supabase = createServiceClient();

  // Check ownership for all marriages
  for (const id of ids) {
    const familyId = await getMarriageFamilyId(id);
    if (!familyId) continue;
    
    if (!await checkAccess(userId, familyId)) {
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

// DELETE handler - By Spouses
async function handleDeleteBySpouses(userId: string, husbandId: string, wifeId: string): Promise<Response> {
  console.log(`[API] DELETE - Deleting marriage by spouses - husband: ${husbandId}, wife: ${wifeId}`);
  
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
  
  if (!await checkAccess(userId, marriage.family_id)) {
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
    const action = url.searchParams.get('action');
    
    // Parse body for POST/PUT/DELETE
    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
      body = await req.json().catch(() => ({}));
    }
    
    console.log(`[API] ${req.method} /api-marriages ${id ? `id=${id}` : ''} ${action ? `action=${action}` : ''}`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        if (!id) return errorResponse('VALIDATION_ERROR', 'Marriage ID is required', 400);
        return await handleGet(user!.id, id);
        
      case 'POST':
        if (action === 'upsert') {
          return await handleUpsert(user!.id, body);
        }
        return await handleCreate(user!.id, body);
        
      case 'PUT':
      case 'PATCH':
        if (action === 'bySpouse') {
          if (!body.spouse_id) {
            return errorResponse('VALIDATION_ERROR', 'spouse_id is required', 400);
          }
          return await handleUpdateBySpouse(user!.id, body.spouse_id as string, body.is_wife as boolean, body);
        }
        if (!id) return errorResponse('VALIDATION_ERROR', 'Marriage ID is required', 400);
        return await handleUpdate(user!.id, id, body);
        
      case 'DELETE':
        if (action === 'batch') {
          return await handleBatchDelete(user!.id, body.ids as string[]);
        }
        if (action === 'bySpouses') {
          if (!body.husband_id || !body.wife_id) {
            return errorResponse('VALIDATION_ERROR', 'husband_id and wife_id are required', 400);
          }
          return await handleDeleteBySpouses(user!.id, body.husband_id as string, body.wife_id as string);
        }
        if (!id) return errorResponse('VALIDATION_ERROR', 'Marriage ID is required', 400);
        return await handleDelete(user!.id, id);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
