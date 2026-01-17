/**
 * Marriages API Endpoints (REST)
 */

import apiClient from '../client';
import type { Marriage, MarriageCreateInput, MarriageUpdateInput, DeleteResponse } from '../types';

const FUNCTION_NAME = 'api-marriages';

export const marriagesApi = {
  get: async (id: string): Promise<Marriage> => {
    return apiClient.get<Marriage>(FUNCTION_NAME, { id });
  },

  create: async (input: MarriageCreateInput): Promise<Marriage> => {
    return apiClient.post<Marriage>(FUNCTION_NAME, input);
  },

  update: async (id: string, input: MarriageUpdateInput): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, input, { id });
  },

  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id });
  },

  batchDelete: async (ids: string[]): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { ids }, { action: 'batch' });
  },

  deleteBySpouses: async (husbandId: string, wifeId: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { husband_id: husbandId, wife_id: wifeId }, { action: 'bySpouses' });
  },

  updateBySpouseId: async (spouseId: string, isWife: boolean, input: MarriageUpdateInput): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, { spouse_id: spouseId, is_wife: isWife, ...input }, { action: 'bySpouse' });
  },

  deactivate: async (id: string): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, { is_active: false }, { id });
  },

  reactivate: async (id: string): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, { is_active: true }, { id });
  },

  upsert: async (input: MarriageCreateInput): Promise<Marriage> => {
    return apiClient.post<Marriage>(FUNCTION_NAME, input, { action: 'upsert' });
  },
};

export default marriagesApi;
