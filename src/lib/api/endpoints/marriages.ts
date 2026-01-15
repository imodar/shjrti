/**
 * Marriages API Endpoints
 * Provides typed methods for marriage-related API calls
 */

import apiClient from '../client';
import type {
  Marriage,
  MarriageCreateInput,
  MarriageUpdateInput,
  DeleteResponse,
} from '../types';

const FUNCTION_NAME = 'api-marriages';

/**
 * Marriages API
 */
export const marriagesApi = {
  /**
   * Get a single marriage by ID
   */
  get: async (id: string): Promise<Marriage> => {
    return apiClient.get<Marriage>(FUNCTION_NAME, { action: 'get', id });
  },

  /**
   * Create a new marriage
   */
  create: async (input: MarriageCreateInput): Promise<Marriage> => {
    return apiClient.post<Marriage>(FUNCTION_NAME, { action: 'create', ...input });
  },

  /**
   * Update a marriage
   */
  update: async (id: string, input: MarriageUpdateInput): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, { action: 'update', id, ...input });
  },

  /**
   * Delete a marriage
   */
  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { action: 'delete', id });
  },

  /**
   * Batch delete marriages
   */
  batchDelete: async (ids: string[]): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { action: 'batchDelete', ids });
  },

  /**
   * Deactivate a marriage (soft delete)
   */
  deactivate: async (id: string): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, { 
      action: 'update', 
      id, 
      is_active: false 
    });
  },

  /**
   * Reactivate a marriage
   */
  reactivate: async (id: string): Promise<Marriage> => {
    return apiClient.put<Marriage>(FUNCTION_NAME, { 
      action: 'update', 
      id, 
      is_active: true 
    });
  },
};

export default marriagesApi;
