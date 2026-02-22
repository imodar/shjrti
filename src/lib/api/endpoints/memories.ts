/**
 * Memories API Endpoints (REST)
 */

import apiClient from '../client';
import type { MemberMemory, FamilyMemory, DeleteResponse } from '../types';

const FUNCTION_NAME = 'api-memories';

export interface MemberMemoryCreateInput {
  member_id: string;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  caption?: string;
}

export interface MemberMemoryUpdateInput {
  caption?: string;
}

export interface FamilyMemoryCreateInput {
  family_id: string;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  caption?: string;
  tags?: string[];
  photo_date?: string;
  linked_member_id?: string;
}

export interface FamilyMemoryUpdateInput {
  caption?: string;
  tags?: string[];
  photo_date?: string;
  linked_member_id?: string;
}

export interface PhotoMemberTag {
  id: string;
  memory_id: string;
  member_id: string;
  x_percent: number;
  y_percent: number;
  created_by: string;
  created_at: string;
}

export interface PhotoTagCreateInput {
  memory_id: string;
  member_id: string;
  x_percent: number;
  y_percent: number;
}

export interface TaggedMemberCount {
  member_id: string;
  count: number;
}

export const memoriesApi = {
  // Member Memories
  getMemberMemories: async (memberId: string): Promise<MemberMemory[]> => {
    return apiClient.get<MemberMemory[]>(FUNCTION_NAME, { type: 'member', memberId });
  },

  createMemberMemory: async (input: MemberMemoryCreateInput): Promise<MemberMemory> => {
    return apiClient.post<MemberMemory>(FUNCTION_NAME, input, { type: 'member' });
  },

  updateMemberMemory: async (id: string, input: MemberMemoryUpdateInput): Promise<MemberMemory> => {
    return apiClient.put<MemberMemory>(FUNCTION_NAME, input, { id, type: 'member' });
  },

  deleteMemberMemory: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id, type: 'member' });
  },

  // Family Memories
  getFamilyMemories: async (familyId: string): Promise<FamilyMemory[]> => {
    return apiClient.get<FamilyMemory[]>(FUNCTION_NAME, { type: 'family', familyId });
  },

  createFamilyMemory: async (input: FamilyMemoryCreateInput): Promise<FamilyMemory> => {
    return apiClient.post<FamilyMemory>(FUNCTION_NAME, input, { type: 'family' });
  },

  updateFamilyMemory: async (id: string, input: FamilyMemoryUpdateInput): Promise<FamilyMemory> => {
    return apiClient.put<FamilyMemory>(FUNCTION_NAME, input, { id, type: 'family' });
  },

  deleteFamilyMemory: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id, type: 'family' });
  },

  // Photo Member Tags
  getPhotoTags: async (memoryId: string): Promise<PhotoMemberTag[]> => {
    return apiClient.get<PhotoMemberTag[]>(FUNCTION_NAME, { type: 'tags', memoryId });
  },

  createPhotoTag: async (input: PhotoTagCreateInput): Promise<PhotoMemberTag> => {
    return apiClient.post<PhotoMemberTag>(FUNCTION_NAME, input, { type: 'tags' });
  },

  deletePhotoTag: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id, type: 'tags' });
  },

  getTaggedMembers: async (familyId: string): Promise<TaggedMemberCount[]> => {
    return apiClient.get<TaggedMemberCount[]>(FUNCTION_NAME, { type: 'tagged-members', familyId });
  },
};

export default memoriesApi;
