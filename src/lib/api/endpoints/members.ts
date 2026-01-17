/**
 * Members API Endpoints (REST)
 */

import apiClient from '../client';
import type { Member, MemberCreateInput, MemberUpdateInput, MemberMemory, DeleteResponse } from '../types';

const FUNCTION_NAME = 'api-members';

export const membersApi = {
  get: async (id: string): Promise<Member> => {
    return apiClient.get<Member>(FUNCTION_NAME, { id });
  },

  create: async (input: MemberCreateInput): Promise<Member> => {
    return apiClient.post<Member>(FUNCTION_NAME, input);
  },

  update: async (id: string, input: MemberUpdateInput): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, input, { id });
  },

  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id });
  },

  getMemories: async (memberId: string): Promise<MemberMemory[]> => {
    return apiClient.get<MemberMemory[]>(FUNCTION_NAME, { id: memberId, include: 'memories' });
  },

  batchCreate: async (members: MemberCreateInput[]): Promise<Member[]> => {
    return apiClient.post<Member[]>(FUNCTION_NAME, { members }, { action: 'batch' });
  },

  batchDelete: async (ids: string[]): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { ids }, { action: 'batch' });
  },

  updateImage: async (id: string, imageUrl: string | null): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, { image_url: imageUrl }, { id });
  },

  updateParents: async (id: string, fatherId: string | null, motherId: string | null): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, { father_id: fatherId, mother_id: motherId }, { id });
  },

  clearParentReference: async (parentId: string, parentType: 'father' | 'mother'): Promise<{ updated: number }> => {
    return apiClient.put<{ updated: number }>(FUNCTION_NAME, { parent_id: parentId, parent_type: parentType }, { action: 'clearParent' });
  },

  updateMaritalStatus: async (id: string, maritalStatus: string): Promise<Member> => {
    return apiClient.put<Member>(FUNCTION_NAME, { marital_status: maritalStatus }, { id });
  },
};

export default membersApi;
