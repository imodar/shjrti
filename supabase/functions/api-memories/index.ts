/**
 * API: Memories (REST)
 * RESTful API for member and family memories CRUD operations
 * 
 * Endpoints:
 * GET    /api-memories?type=member&memberId=xxx     → Get member memories
 * GET    /api-memories?type=family&familyId=xxx     → Get family memories
 * POST   /api-memories?type=member                  → Create member memory
 * POST   /api-memories?type=family                  → Create family memory
 * PUT    /api-memories?id=xxx&type=member           → Update member memory
 * PUT    /api-memories?id=xxx&type=family           → Update family memory
 * DELETE /api-memories?id=xxx&type=member           → Delete member memory
 * DELETE /api-memories?id=xxx&type=family           → Delete family memory
 */

import { corsHeaders, successResponse, errorResponse, HttpStatus } from '../_shared/apiHelpers.ts';
import { authenticateRequest, createServiceClient } from '../_shared/authHelpers.ts';
import { logActivity } from '../_shared/activityLogger.ts';

// ============= Helper Functions =============

async function checkAccess(userId: string, familyId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('creator_id', userId)
    .maybeSingle();
  if (family) return true;
  const { data: collab } = await supabase
    .from('family_collaborators')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!collab;
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

// ============= GET Handlers =============

async function handleGetMemberMemories(userId: string, memberId: string): Promise<Response> {
  console.log(`[API] GET - Getting memories for member: ${memberId}`);
  
  const familyId = await getMemberFamilyId(memberId);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', HttpStatus.NOT_FOUND);
  }

  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('member_memories')
    .select('*')
    .eq('member_id', memberId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
  }

  return successResponse(data);
}

async function handleGetFamilyMemories(userId: string, familyId: string): Promise<Response> {
  console.log(`[API] GET - Getting memories for family: ${familyId}`);
  
  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('family_memories')
    .select('*')
    .eq('family_id', familyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
  }

  return successResponse(data);
}

// ============= POST Handlers =============

async function handleCreateMemberMemory(userId: string, payload: Record<string, unknown>): Promise<Response> {
  console.log(`[API] POST - Creating member memory`);
  
  const { member_id, file_path, original_filename, content_type, file_size, caption } = payload;

  if (!member_id || !file_path || !original_filename || !content_type || file_size === undefined) {
    return errorResponse('VALIDATION_ERROR', 'Missing required fields', HttpStatus.BAD_REQUEST);
  }

  const familyId = await getMemberFamilyId(member_id as string);
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Member not found', HttpStatus.NOT_FOUND);
  }

  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
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
      return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
    }

    // Log activity (non-blocking)
    logActivity({
      familyId,
      userId,
      actionType: 'photo_uploaded',
      targetName: (original_filename as string) || '',
      metadata: { memory_id: data.id, member_id, type: 'member' },
    });

    return successResponse(data, HttpStatus.CREATED);
}

async function handleCreateFamilyMemory(userId: string, payload: Record<string, unknown>): Promise<Response> {
  console.log(`[API] POST - Creating family memory`);
  
  const { family_id, file_path, original_filename, content_type, file_size, caption, tags, photo_date, linked_member_id } = payload;

  if (!family_id || !file_path || !original_filename || !content_type || file_size === undefined) {
    return errorResponse('VALIDATION_ERROR', 'Missing required fields', HttpStatus.BAD_REQUEST);
  }

  const hasAccess = await checkAccess(userId, family_id as string);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
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
      return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
    }

    // Log activity (non-blocking)
    logActivity({
      familyId: family_id as string,
      userId,
      actionType: 'photo_uploaded',
      targetName: (original_filename as string) || '',
      metadata: { memory_id: data.id, type: 'family' },
    });

    return successResponse(data, HttpStatus.CREATED);
}

// ============= PUT Handlers =============

async function handleUpdateMemberMemory(userId: string, memoryId: string, payload: Record<string, unknown>): Promise<Response> {
  console.log(`[API] PUT - Updating member memory: ${memoryId}`);
  
  const familyId = await getMemoryFamilyId(memoryId, 'member');
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Memory not found', HttpStatus.NOT_FOUND);
  }

  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
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
    return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
  }

  return successResponse(data);
}

async function handleUpdateFamilyMemory(userId: string, memoryId: string, payload: Record<string, unknown>): Promise<Response> {
  console.log(`[API] PUT - Updating family memory: ${memoryId}`);
  
  const familyId = await getMemoryFamilyId(memoryId, 'family');
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Memory not found', HttpStatus.NOT_FOUND);
  }

  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
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
    return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
  }

  return successResponse(data);
}

// ============= DELETE Handlers =============

async function handleDeleteMemberMemory(userId: string, memoryId: string): Promise<Response> {
  console.log(`[API] DELETE - Deleting member memory: ${memoryId}`);
  
  const familyId = await getMemoryFamilyId(memoryId, 'member');
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Memory not found', HttpStatus.NOT_FOUND);
  }

  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
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
    return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
  }

  // Attempt to delete from storage (non-blocking)
  if (memory?.file_path) {
    await supabase.storage.from('member-memories').remove([memory.file_path]).catch(() => {});
  }

  return successResponse({ deleted: true, id: memoryId });
}

async function handleDeleteFamilyMemory(userId: string, memoryId: string): Promise<Response> {
  console.log(`[API] DELETE - Deleting family memory: ${memoryId}`);
  
  const familyId = await getMemoryFamilyId(memoryId, 'family');
  if (!familyId) {
    return errorResponse('NOT_FOUND', 'Memory not found', HttpStatus.NOT_FOUND);
  }

  const hasAccess = await checkAccess(userId, familyId);
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'Unauthorized', HttpStatus.FORBIDDEN);
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
    return errorResponse('DATABASE_ERROR', error.message, HttpStatus.BAD_REQUEST);
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
      return errorResponse('UNAUTHORIZED', 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const userId = authResult.user.id;

    // Parse URL and query params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') as 'member' | 'family' | null;
    const memberId = url.searchParams.get('memberId');
    const familyId = url.searchParams.get('familyId');
    
    // Parse body for POST/PUT
    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = await req.json().catch(() => ({}));
    }

    console.log(`[API] ${req.method} /api-memories ${type ? `type=${type}` : ''} ${id ? `id=${id}` : ''}`);

    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        if (type === 'member' && memberId) {
          return handleGetMemberMemories(userId, memberId);
        }
        if (type === 'family' && familyId) {
          return handleGetFamilyMemories(userId, familyId);
        }
        return errorResponse('VALIDATION_ERROR', 'type and memberId/familyId are required', HttpStatus.BAD_REQUEST);
      
      case 'POST':
        if (type === 'member') {
          return handleCreateMemberMemory(userId, body);
        }
        if (type === 'family') {
          return handleCreateFamilyMemory(userId, body);
        }
        return errorResponse('VALIDATION_ERROR', 'type (member/family) is required', HttpStatus.BAD_REQUEST);
      
      case 'PUT':
      case 'PATCH':
        if (!id) {
          return errorResponse('VALIDATION_ERROR', 'Memory ID is required', HttpStatus.BAD_REQUEST);
        }
        if (type === 'member') {
          return handleUpdateMemberMemory(userId, id, body);
        }
        if (type === 'family') {
          return handleUpdateFamilyMemory(userId, id, body);
        }
        return errorResponse('VALIDATION_ERROR', 'type (member/family) is required', HttpStatus.BAD_REQUEST);
      
      case 'DELETE':
        if (!id) {
          return errorResponse('VALIDATION_ERROR', 'Memory ID is required', HttpStatus.BAD_REQUEST);
        }
        if (type === 'member') {
          return handleDeleteMemberMemory(userId, id);
        }
        if (type === 'family') {
          return handleDeleteFamilyMemory(userId, id);
        }
        return errorResponse('VALIDATION_ERROR', 'type (member/family) is required', HttpStatus.BAD_REQUEST);
      
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, HttpStatus.METHOD_NOT_ALLOWED);
    }
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
});
