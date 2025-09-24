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
  clearSubscriptionCache: () => void;
  showExpiryWarning: boolean;
  hasAIFeatures: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(false); // Start with false, only load when needed
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load subscription from cache first
  const loadSubscriptionFromCache = (userId: string) => {
    try {
      const cached = localStorage.getItem(`subscription_${userId}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        // Check if cache is less than 1 hour old
        if (Date.now() - cachedData.timestamp < 3600000) {
          setSubscription(cachedData.data);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading subscription from cache:', error);
    }
    return false;
  };

  // Save subscription to cache
  const saveSubscriptionToCache = (userId: string, data: SubscriptionDetails) => {
    try {
      localStorage.setItem(`subscription_${userId}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving subscription to cache:', error);
    }
  };

  const fetchSubscriptionDetails = async (forceRefresh = false) => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    // Don't fetch if we already have data for this user and it's not a forced refresh
    if (!forceRefresh && lastFetchedUserId === user.id && subscription) {
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    // Try loading from cache first (unless force refresh)
    if (!forceRefresh && loadSubscriptionFromCache(user.id)) {
      setLastFetchedUserId(user.id);
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_subscription_details', {
        user_uuid: user.id
      });

      let subscriptionData: SubscriptionDetails;

      if (error) {
        console.error('Error fetching subscription details:', error);
        // If there's an error, default to free plan (not expired) to avoid blocking access
        subscriptionData = {
          subscription_id: null,
          package_name: null,
          status: 'free',
          expires_at: null,
          days_until_expiry: null,
          is_expired: false, // Free plan is not expired
          ai_features_enabled: false
        };
      } else if (data && data.length > 0) {
        subscriptionData = data[0];
      } else {
        // No active subscription found - user is on free plan
        subscriptionData = {
          subscription_id: null,
          package_name: null,
          status: 'free',
          expires_at: null,
          days_until_expiry: null,
          is_expired: false, // Free plan is not expired
          ai_features_enabled: false
        };
      }

      setSubscription(subscriptionData);
      setLastFetchedUserId(user.id);
      saveSubscriptionToCache(user.id, subscriptionData);
    } catch (error) {
      console.error('Error in fetchSubscriptionDetails:', error);
      // On error, default to free plan to avoid blocking access
      const errorSubscription = {
        subscription_id: null,
        package_name: null,
        status: 'free',
        expires_at: null,
        days_until_expiry: null,
        is_expired: false, // Free plan is not expired
        ai_features_enabled: false
      };
      setSubscription(errorSubscription);
      setLastFetchedUserId(user.id);
      saveSubscriptionToCache(user.id, errorSubscription);
    } finally {
      setLoading(false);
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    // Only fetch subscription when user logs in (user changes from null to a user)
    if (user && !hasInitialized) {
      fetchSubscriptionDetails();
    } else if (!user) {
      // Clear subscription when user logs out
      setSubscription(null);
      setLoading(false);
      setHasInitialized(true);
      setLastFetchedUserId(null);
      // Clear all cached subscriptions on logout
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('subscription_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [user]); // Only depend on user, not hasInitialized

  // Auto-refresh removed - only check subscription on login or manual refresh

  const refreshSubscription = async () => {
    await fetchSubscriptionDetails(true); // Force refresh
  };

  // Clear cache for specific actions (upgrade/downgrade)
  const clearSubscriptionCache = () => {
    if (user) {
      localStorage.removeItem(`subscription_${user.id}`);
    }
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
    clearSubscriptionCache,
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