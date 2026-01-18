/**
 * Scheduled Package Changes API Endpoints (REST)
 */

import apiClient from '../client';

const FUNCTION_NAME = 'api-scheduled-changes';

export interface ScheduledPackage {
  id: string;
  name: Record<string, string> | string;
  price_usd?: number;
  price_sar?: number;
}

export interface ScheduledChange {
  id: string;
  user_id: string;
  current_package_id: string;
  target_package_id: string;
  scheduled_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_package?: ScheduledPackage;
  target_package?: ScheduledPackage;
}

export interface ScheduledChangeCreateInput {
  current_package_id: string;
  target_package_id: string;
  scheduled_date: string;
}

export const scheduledChangesApi = {
  /**
   * Get user's pending scheduled change
   */
  get: async (): Promise<ScheduledChange | null> => {
    return apiClient.get<ScheduledChange | null>(FUNCTION_NAME);
  },

  /**
   * Create a new scheduled change
   */
  create: async (input: ScheduledChangeCreateInput): Promise<ScheduledChange> => {
    return apiClient.post<ScheduledChange>(FUNCTION_NAME, input);
  },

  /**
   * Cancel a scheduled change
   */
  cancel: async (id?: string): Promise<{ deleted: boolean }> => {
    return apiClient.delete<{ deleted: boolean }>(FUNCTION_NAME, undefined, id ? { id } : undefined);
  },
};

export default scheduledChangesApi;
