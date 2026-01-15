/**
 * Members API Endpoints
 * Provides typed methods for family member-related API calls
 */

import apiClient from '../client';
import type {
  Member,
  MemberCreateInput,
  MemberUpdateInput,
  MemberMemory,
  DeleteResponse,
} from '../types';

const FUNCTION_NAME = 'api-members';

/**
 * Members API
 */
export const membersApi = {
  /**
   * Get a single member by ID
   */
  get: async (id: string): Promise<Member> => {
    return apiClient.get<Member>(FUNCTION_NAME, { action: 'get', id });
  },

  /**
   * Create a new member
   */
  create: async (input: MemberCreateInput): Promise<Member> => {
    return apiClient.post<Member>(FUNCTION_NAME, { action: 'create', ...input });
  },

  /**
   * Update a member
   */
  update: async (id: string, input: MemberUpdateInput): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, { action: 'update', id, ...input });
  },

  /**
   * Delete a member
   */
  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { action: 'delete', id });
  },

  /**
   * Get member's memories
   */
  getMemories: async (memberId: string): Promise<MemberMemory[]> => {
    return apiClient.get<MemberMemory[]>(FUNCTION_NAME, { action: 'getMemories', memberId });
  },

  /**
   * Batch create members
   */
  batchCreate: async (members: MemberCreateInput[]): Promise<Member[]> => {
    return apiClient.post<Member[]>(FUNCTION_NAME, { action: 'batchCreate', members });
  },

  /**
   * Update member's image
   */
  updateImage: async (id: string, imageUrl: string | null): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, { 
      action: 'update', 
      id, 
      image_url: imageUrl 
    });
  },

  /**
   * Update member's parents
   */
  updateParents: async (
    id: string, 
    fatherId: string | null, 
    motherId: string | null
  ): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, { 
      action: 'update', 
      id, 
      father_id: fatherId,
      mother_id: motherId,
    });
  },
};

export default membersApi;
