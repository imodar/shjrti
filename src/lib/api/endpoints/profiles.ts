/**
 * Profiles API Endpoints (REST)
 */

import apiClient from '../client';

const FUNCTION_NAME = 'api-profiles';

export interface Profile {
  id?: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_preference: string | null;
  theme_mode: string | null;
  theme_variant: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_preference?: string;
  theme_mode?: string;
  theme_variant?: string;
}

export const profilesApi = {
  /**
   * Get current user's profile
   */
  get: async (): Promise<Profile> => {
    return apiClient.get<Profile>(FUNCTION_NAME);
  },

  /**
   * Update current user's profile
   */
  update: async (input: ProfileUpdateInput): Promise<Profile> => {
    return apiClient.put<Profile>(FUNCTION_NAME, input);
  },
};

export default profilesApi;
