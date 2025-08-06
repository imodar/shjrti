import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionDetails {
  subscription_id: string | null;
  package_name: any;
  status: string | null;
  expires_at: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  ai_features_enabled: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionDetails | null;
  loading: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  refreshSubscription: () => Promise<void>;
  showExpiryWarning: boolean;
  hasAIFeatures: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchSubscriptionDetails = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching subscription for user:', user.id);
      console.log('Clearing any cached subscription data...');
      setSubscription(null);
      const { data, error } = await supabase.rpc('get_user_subscription_details', {
        user_uuid: user.id
      });

      console.log('Subscription data received:', data);
      console.log('Subscription error:', error);
      console.log('Raw subscription details:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Error fetching subscription details:', error);
        // If no subscription found, treat as expired
        setSubscription({
          subscription_id: null,
          package_name: null,
          status: null,
          expires_at: null,
          days_until_expiry: null,
          is_expired: true,
          ai_features_enabled: false
        });
      } else if (data && data.length > 0) {
        console.log('Setting subscription data:', data[0]);
        setSubscription(data[0]);
      } else {
        console.log('No active subscription found in data');
        // No active subscription found
        setSubscription({
          subscription_id: null,
          package_name: null,
          status: null,
          expires_at: null,
          days_until_expiry: null,
          is_expired: true,
          ai_features_enabled: false
        });
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionDetails:', error);
      setSubscription({
        subscription_id: null,
        package_name: null,
        status: null,
        expires_at: null,
        days_until_expiry: null,
        is_expired: true,
        ai_features_enabled: false
      });
    } finally {
      setLoading(false);
      setHasAttemptedFetch(true);
    }
  };

  useEffect(() => {
    // Force refresh subscription data every time user state changes
    if (user) {
      setHasAttemptedFetch(false); // Force refresh
      fetchSubscriptionDetails();
    } else if (!user) {
      // Clear subscription when user logs out
      setSubscription(null);
      setLoading(false);
      setHasAttemptedFetch(false);
    }
  }, [user, hasAttemptedFetch]);

  // Auto-refresh removed - only check subscription on login or manual refresh

  const refreshSubscription = async () => {
    await fetchSubscriptionDetails();
  };

  // Never consider expired while loading, and only expired if subscription data confirms it
  const isExpired = loading ? false : (subscription?.is_expired ?? false);
  const daysUntilExpiry = subscription?.days_until_expiry ?? null;
  const showExpiryWarning = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7;
  const hasAIFeatures = !isExpired && (subscription?.ai_features_enabled ?? false);

  const value = {
    subscription,
    loading,
    isExpired,
    daysUntilExpiry,
    refreshSubscription,
    showExpiryWarning,
    hasAIFeatures,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}