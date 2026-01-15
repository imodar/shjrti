/**
 * Families API Endpoints
 * Provides typed methods for family-related API calls
 */

import apiClient from '../client';
import type {
  Family,
  FamilyCreateInput,
  FamilyUpdateInput,
  Member,
  Marriage,
  DeleteResponse,
} from '../types';

const FUNCTION_NAME = 'api-families';

/**
 * Families API
 */
export const familiesApi = {
  /**
   * Get all families for the current user
   */
  list: async (): Promise<Family[]> => {
    return apiClient.get<Family[]>(FUNCTION_NAME, { action: 'list' });
  },

  /**
   * Get a single family by ID
   */
  get: async (id: string): Promise<Family> => {
    return apiClient.get<Family>(FUNCTION_NAME, { action: 'get', id });
  },

  /**
   * Create a new family
   */
  create: async (input: FamilyCreateInput): Promise<Family> => {
    return apiClient.post<Family>(FUNCTION_NAME, { action: 'create', ...input });
  },

  /**
   * Update a family
   */
  update: async (id: string, input: FamilyUpdateInput): Promise<Family> => {
    return apiClient.put<Family>(FUNCTION_NAME, { action: 'update', id, ...input });
  },

  /**
   * Delete a family
   */
  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, { action: 'delete', id });
  },

  /**
   * Get all members of a family
   */
  getMembers: async (familyId: string): Promise<Member[]> => {
    return apiClient.get<Member[]>(FUNCTION_NAME, { action: 'getMembers', familyId });
  },

  /**
   * Get all marriages of a family
   */
  getMarriages: async (familyId: string): Promise<Marriage[]> => {
    return apiClient.get<Marriage[]>(FUNCTION_NAME, { action: 'getMarriages', familyId });
  },

  /**
   * Archive a family
   */
  archive: async (id: string): Promise<Family> => {
    return apiClient.put<Family>(FUNCTION_NAME, { 
      action: 'update', 
      id, 
      is_archived: true, 
      archived_at: new Date().toISOString() 
    });
  },

  /**
   * Unarchive a family
   */
  unarchive: async (id: string): Promise<Family> => {
    return apiClient.put<Family>(FUNCTION_NAME, { 
      action: 'update', 
      id, 
      is_archived: false, 
      archived_at: null 
    });
  },

  /**
   * Generate a new share token
   */
  regenerateShareToken: async (id: string, expiresInHours: number = 2): Promise<{
    share_token: string;
    expires_at: string;
  }> => {
    return apiClient.post<{ share_token: string; expires_at: string }>(
      FUNCTION_NAME,
      { action: 'regenerateShareToken', id, expiresInHours }
    );
  },
};

export default familiesApi;
