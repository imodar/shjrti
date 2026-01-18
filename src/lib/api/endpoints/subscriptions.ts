/**
 * Subscriptions API Endpoints (REST)
 */

import apiClient from '../client';

const FUNCTION_NAME = 'api-subscriptions';

export interface Package {
  id: string;
  name: Record<string, string> | string;
  description?: Record<string, string> | string;
  max_family_trees: number | null;
  max_family_members: number | null;
  price_sar: number | null;
  price_usd: number | null;
  features?: unknown;
  ai_features_enabled?: boolean;
  custom_domains_enabled?: boolean;
  image_upload_enabled?: boolean;
}

export interface Subscription {
  id?: string;
  user_id: string;
  package_id?: string;
  status: string;
  started_at?: string;
  expires_at?: string | null;
  paypal_subscription_id?: string | null;
  payment_token_id?: string | null;
  created_at?: string;
  updated_at?: string;
  packages?: Package;
  // For free users
  package?: {
    name: Record<string, string>;
    max_family_trees: number;
    max_family_members: number;
    price_sar: number;
    price_usd: number;
  };
}

export interface SubscriptionDetails {
  subscription_id: string;
  package_name: Record<string, string> | string;
  status: string;
  expires_at: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  ai_features_enabled: boolean;
}

export const subscriptionsApi = {
  /**
   * Get current user's subscription with package details
   */
  get: async (): Promise<Subscription> => {
    return apiClient.get<Subscription>(FUNCTION_NAME);
  },

  /**
   * Get detailed subscription info via RPC
   */
  getDetails: async (): Promise<SubscriptionDetails | null> => {
    return apiClient.get<SubscriptionDetails | null>(FUNCTION_NAME, { details: 'true' });
  },
};

export default subscriptionsApi;
