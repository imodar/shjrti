/**
 * Packages API Endpoints (REST)
 */

import apiClient from '../client';

const FUNCTION_NAME = 'api-packages';

export interface Package {
  id: string;
  name: Record<string, string> | string;
  description?: Record<string, string> | string;
  features?: Record<string, string[]> | string[];
  price_sar: number | null;
  price_usd: number | null;
  max_family_trees: number | null;
  max_family_members: number | null;
  ai_features_enabled?: boolean;
  custom_domains_enabled?: boolean;
  image_upload_enabled?: boolean;
  is_featured?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const packagesApi = {
  /**
   * List all active packages
   */
  list: async (): Promise<Package[]> => {
    return apiClient.get<Package[]>(FUNCTION_NAME);
  },

  /**
   * Get a specific package by ID
   */
  get: async (id: string): Promise<Package> => {
    return apiClient.get<Package>(FUNCTION_NAME, { id });
  },
};

export default packagesApi;
