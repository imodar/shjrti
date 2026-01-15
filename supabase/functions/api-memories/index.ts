/**
 * Memories API Edge Function
 * Handles CRUD operations for member and family memories
 */

import { corsHeaders, successResponse, errorResponse } from '../_shared/apiHelpers.ts';
import { authenticateRequest, createServiceClient } from '../_shared/authHelpers.ts';

// ============= Helper Functions =============

async function checkFamilyOwnership(userId: string, familyId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('creator_id', userId)
    .single();
  return !!data;
}

async function getMemberFamilyId(memberId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('family_tree_members')
    .select('family_id')
    .eq('id', memberId)
    .single();
  return data?.family_id || null;
}

async function getMemoryFamilyId(memoryId: string, type: 'member' | 'family'): Promise<string | null> {
  const supabase = createServiceClient();
  
  if (type === 'member') {
    const { data } = await supabase
      .from('member_memories')
      .select('member_id')
      .eq('id', memoryId)
      .single();
    
    if (data?.member_id) {
      return getMemberFamilyId(data.member_id);
    }
  } else {
    const { data } = await supabase
      .from('family_memories')
      .select('family_id')
      .eq('id', memoryId)
      .single();
    return data?.family_id || null;
  }
  
  return null;
}

// ============= Member Memories Handlers =============

async function handleGetMemberMemories(userId: string, memberId: string): Promise<Response> {
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('Member not found', 404);
  }

  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('member_memories')
    .select('*')
    .eq('member_id', memberId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return errorResponse(error.message, 400);
  }

  return successResponse(data);
}

async function handleCreateMemberMemory(userId: string, payload: Record<string, unknown>): Promise<Response> {
  const { member_id, file_path, original_filename, content_type, file_size, caption } = payload;

  if (!member_id || !file_path || !original_filename || !content_type || file_size === undefined) {
    return errorResponse('Missing required fields', 400);
  }

  const familyId = await getMemberFamilyId(member_id as string);
  if (!familyId) {
    return errorResponse('Member not found', 404);
  }

  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('member_memories')
    .insert({
      member_id,
      file_path,
      original_filename,
      content_type,
      file_size,
      caption: caption || null,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 400);
  }

  return successResponse(data, 201);
}

async function handleUpdateMemberMemory(userId: string, memoryId: string, payload: Record<string, unknown>): Promise<Response> {
  const familyId = await getMemoryFamilyId(memoryId, 'member');
  if (!familyId) {
    return errorResponse('Memory not found', 404);
  }

  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const { caption } = payload;
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('member_memories')
    .update({ caption, updated_at: new Date().toISOString() })
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 400);
  }

  return successResponse(data);
}

async function handleDeleteMemberMemory(userId: string, memoryId: string): Promise<Response> {
  const familyId = await getMemoryFamilyId(memoryId, 'member');
  if (!familyId) {
    return errorResponse('Memory not found', 404);
  }

  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const supabase = createServiceClient();
  
  // Get file path for storage cleanup
  const { data: memory } = await supabase
    .from('member_memories')
    .select('file_path')
    .eq('id', memoryId)
    .single();

  // Delete from database
  const { error } = await supabase
    .from('member_memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    return errorResponse(error.message, 400);
  }

  // Attempt to delete from storage (non-blocking)
  if (memory?.file_path) {
    await supabase.storage.from('member-memories').remove([memory.file_path]).catch(() => {});
  }

  return successResponse({ deleted: true, id: memoryId });
}

// ============= Family Memories Handlers =============

async function handleGetFamilyMemories(userId: string, familyId: string): Promise<Response> {
  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_memories')
    .select('*')
    .eq('family_id', familyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return errorResponse(error.message, 400);
  }

  return successResponse(data);
}

async function handleCreateFamilyMemory(userId: string, payload: Record<string, unknown>): Promise<Response> {
  const { family_id, file_path, original_filename, content_type, file_size, caption, tags, photo_date, linked_member_id } = payload;

  if (!family_id || !file_path || !original_filename || !content_type || file_size === undefined) {
    return errorResponse('Missing required fields', 400);
  }

  const isOwner = await checkFamilyOwnership(userId, family_id as string);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_memories')
    .insert({
      family_id,
      file_path,
      original_filename,
      content_type,
      file_size,
      caption: caption || null,
      tags: tags || null,
      photo_date: photo_date || null,
      linked_member_id: linked_member_id || null,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 400);
  }

  return successResponse(data, 201);
}

async function handleUpdateFamilyMemory(userId: string, memoryId: string, payload: Record<string, unknown>): Promise<Response> {
  const familyId = await getMemoryFamilyId(memoryId, 'family');
  if (!familyId) {
    return errorResponse('Memory not found', 404);
  }

  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const { caption, tags, photo_date, linked_member_id } = payload;
  
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_memories')
    .update({ 
      caption, 
      tags, 
      photo_date, 
      linked_member_id,
      updated_at: new Date().toISOString() 
    })
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 400);
  }

  return successResponse(data);
}

async function handleDeleteFamilyMemory(userId: string, memoryId: string): Promise<Response> {
  const familyId = await getMemoryFamilyId(memoryId, 'family');
  if (!familyId) {
    return errorResponse('Memory not found', 404);
  }

  const isOwner = await checkFamilyOwnership(userId, familyId);
  if (!isOwner) {
    return errorResponse('Unauthorized', 403);
  }

  const supabase = createServiceClient();
  
  // Get file path for storage cleanup
  const { data: memory } = await supabase
    .from('family_memories')
    .select('file_path')
    .eq('id', memoryId)
    .single();

  // Delete from database
  const { error } = await supabase
    .from('family_memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    return errorResponse(error.message, 400);
  }

  // Attempt to delete from storage (non-blocking)
  if (memory?.file_path) {
    await supabase.storage.from('family-memories').remove([memory.file_path]).catch(() => {});
  }

  return successResponse({ deleted: true, id: memoryId });
}

// ============= Main Handler =============

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = authResult.user.id;

    // Parse request
    const body = await req.json().catch(() => ({}));
    const { action, ...payload } = body;

    // Route to handlers
    switch (action) {
      // Member memories
      case 'getMemberMemories':
        return handleGetMemberMemories(userId, payload.member_id as string);
      case 'createMemberMemory':
        return handleCreateMemberMemory(userId, payload);
      case 'updateMemberMemory':
        return handleUpdateMemberMemory(userId, payload.id as string, payload);
      case 'deleteMemberMemory':
        return handleDeleteMemberMemory(userId, payload.id as string);
      
      // Family memories
      case 'getFamilyMemories':
        return handleGetFamilyMemories(userId, payload.family_id as string);
      case 'createFamilyMemory':
        return handleCreateFamilyMemory(userId, payload);
      case 'updateFamilyMemory':
        return handleUpdateFamilyMemory(userId, payload.id as string, payload);
      case 'deleteFamilyMemory':
        return handleDeleteFamilyMemory(userId, payload.id as string);
      
      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
