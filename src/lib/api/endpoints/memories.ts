/**
 * Memories API Endpoints
 * Provides typed methods for memory-related API calls
 */

import apiClient from '../client';
import type { MemberMemory, FamilyMemory, DeleteResponse } from '../types';

const FUNCTION_NAME = 'api-memories';

// ============= Member Memory Input Types =============

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

// ============= Family Memory Input Types =============

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

/**
 * Memories API
 */
export const memoriesApi = {
  // ============= Member Memories =============
  
  /**
   * Get all memories for a member
   */
  getMemberMemories: async (memberId: string): Promise<MemberMemory[]> => {
    return apiClient.post<MemberMemory[]>(FUNCTION_NAME, { 
      action: 'getMemberMemories', 
      member_id: memberId 
    });
  },

  /**
   * Create a new member memory
   */
  createMemberMemory: async (input: MemberMemoryCreateInput): Promise<MemberMemory> => {
    return apiClient.post<MemberMemory>(FUNCTION_NAME, { 
      action: 'createMemberMemory', 
      ...input 
    });
  },

  /**
   * Update a member memory
   */
  updateMemberMemory: async (id: string, input: MemberMemoryUpdateInput): Promise<MemberMemory> => {
    return apiClient.post<MemberMemory>(FUNCTION_NAME, { 
      action: 'updateMemberMemory', 
      id, 
      ...input 
    });
  },

  /**
   * Delete a member memory
   */
  deleteMemberMemory: async (id: string): Promise<DeleteResponse> => {
    return apiClient.post<DeleteResponse>(FUNCTION_NAME, { 
      action: 'deleteMemberMemory', 
      id 
    });
  },

  // ============= Family Memories =============
  
  /**
   * Get all memories for a family
   */
  getFamilyMemories: async (familyId: string): Promise<FamilyMemory[]> => {
    return apiClient.post<FamilyMemory[]>(FUNCTION_NAME, { 
      action: 'getFamilyMemories', 
      family_id: familyId 
    });
  },

  /**
   * Create a new family memory
   */
  createFamilyMemory: async (input: FamilyMemoryCreateInput): Promise<FamilyMemory> => {
    return apiClient.post<FamilyMemory>(FUNCTION_NAME, { 
      action: 'createFamilyMemory', 
      ...input 
    });
  },

  /**
   * Update a family memory
   */
  updateFamilyMemory: async (id: string, input: FamilyMemoryUpdateInput): Promise<FamilyMemory> => {
    return apiClient.post<FamilyMemory>(FUNCTION_NAME, { 
      action: 'updateFamilyMemory', 
      id, 
      ...input 
    });
  },

  /**
   * Delete a family memory
   */
  deleteFamilyMemory: async (id: string): Promise<DeleteResponse> => {
    return apiClient.post<DeleteResponse>(FUNCTION_NAME, { 
      action: 'deleteFamilyMemory', 
      id 
    });
  },
};

export default memoriesApi;
