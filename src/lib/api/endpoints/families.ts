/**
 * Families API Endpoints (REST)
 */

import apiClient from '../client';
import type { Family, FamilyCreateInput, FamilyUpdateInput, Member, Marriage, DeleteResponse } from '../types';

export interface ActivityLogEntry {
  id: string;
  family_id: string;
  user_id: string;
  action_type: string;
  target_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name: string | null;
}

const FUNCTION_NAME = 'api-families';

export const familiesApi = {
  list: async (): Promise<Family[]> => {
    return apiClient.get<Family[]>(FUNCTION_NAME);
  },

  get: async (id: string): Promise<Family> => {
    return apiClient.get<Family>(FUNCTION_NAME, { id });
  },

  create: async (input: FamilyCreateInput): Promise<Family> => {
    return apiClient.post<Family>(FUNCTION_NAME, input);
  },

  update: async (id: string, input: FamilyUpdateInput): Promise<Family> => {
    return apiClient.put<Family>(FUNCTION_NAME, input, { id });
  },

  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id });
  },

  getMembers: async (familyId: string): Promise<Member[]> => {
    return apiClient.get<Member[]>(FUNCTION_NAME, { id: familyId, include: 'members' });
  },

  getMarriages: async (familyId: string): Promise<Marriage[]> => {
    return apiClient.get<Marriage[]>(FUNCTION_NAME, { id: familyId, include: 'marriages' });
  },

  archive: async (id: string): Promise<Family> => {
    return apiClient.put<Family>(FUNCTION_NAME, { is_archived: true, archived_at: new Date().toISOString() }, { id });
  },

  unarchive: async (id: string): Promise<Family> => {
    return apiClient.put<Family>(FUNCTION_NAME, { is_archived: false, archived_at: null }, { id });
  },

  regenerateShareToken: async (id: string, expiresInHours: number = 2): Promise<{ share_token: string; expires_at: string }> => {
    return apiClient.post<{ share_token: string; expires_at: string }>(FUNCTION_NAME, undefined, { id, action: 'regenerateShareToken', expiresInHours });
  },

  getActivityLog: async (familyId: string): Promise<ActivityLogEntry[]> => {
    return apiClient.get<ActivityLogEntry[]>(FUNCTION_NAME, { id: familyId, include: 'activity' });
  },
};

export default familiesApi;
