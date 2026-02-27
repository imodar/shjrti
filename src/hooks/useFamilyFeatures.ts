/**
 * Hook to get family features based on the tree OWNER's subscription.
 * Collaborators inherit the owner's package features when managing a shared tree.
 */

import { useState, useEffect } from 'react';
import { subscriptionsApi, FamilyFeatures } from '@/lib/api/endpoints/subscriptions';
import { useAuth } from '@/contexts/AuthContext';

const cache = new Map<string, { data: FamilyFeatures; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFamilyFeatures(familyId: string | null | undefined) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<FamilyFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !user) {
      setFeatures(null);
      setLoading(false);
      return;
    }

    // Check cache
    const cached = cache.get(familyId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFeatures(cached.data);
      setLoading(false);
      return;
    }

    const fetchFeatures = async () => {
      setLoading(true);
      try {
        const data = await subscriptionsApi.getFamilyFeatures(familyId);
        cache.set(familyId, { data, timestamp: Date.now() });
        setFeatures(data);
      } catch (error) {
        console.error('Error fetching family features:', error);
        // Fallback to free features
        setFeatures({
          owner_id: '',
          has_active_subscription: false,
          image_upload_enabled: false,
          custom_domains_enabled: false,
          ai_features_enabled: false,
          max_family_members: 50,
          member_memories_enabled: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [familyId, user?.id]);

  return {
    features,
    loading,
    imageUploadEnabled: features?.image_upload_enabled ?? false,
    customDomainsEnabled: features?.custom_domains_enabled ?? false,
    aiEnabled: features?.ai_features_enabled ?? false,
    memberMemoriesEnabled: features?.member_memories_enabled ?? false,
    maxFamilyMembers: features?.max_family_members ?? 50,
  };
}
