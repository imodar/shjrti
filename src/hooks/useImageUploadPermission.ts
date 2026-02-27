import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyFeatures } from '@/hooks/useFamilyFeatures';

/**
 * Check image upload permission.
 * If familyId is provided, uses the tree OWNER's subscription (for collaborators).
 * Otherwise falls back to the current user's own subscription.
 */
export function useImageUploadPermission(familyId?: string | null) {
  const { user } = useAuth();
  const { imageUploadEnabled: ownerHasUpload, memberMemoriesEnabled: ownerHasMemories, loading: familyLoading } = useFamilyFeatures(familyId);
  const [ownPermission, setOwnPermission] = useState(false);
  const [ownLoading, setOwnLoading] = useState(true);

  // If familyId is provided, use owner's features
  const useFamilyBased = !!familyId;

  useEffect(() => {
    // Skip own check if using family-based features
    if (useFamilyBased) {
      setOwnLoading(false);
      return;
    }

    const checkImageUploadPermission = async () => {
      if (!user) {
        setOwnPermission(false);
        setOwnLoading(false);
        return;
      }

      try {
        const { data: subscriptionData, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            packages:package_id (
              image_upload_enabled,
              features,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
          setOwnPermission(false);
          setOwnLoading(false);
          return;
        }

        const pkg: any = subscriptionData?.packages;
        const featureFlag = pkg?.features?.member_memories;
        const memberMemoriesEnabled = featureFlag === true || featureFlag === 'true' || featureFlag === 1;
        const hasPermission = Boolean(pkg?.image_upload_enabled) || memberMemoriesEnabled;
        
        setOwnPermission(hasPermission);
      } catch (error) {
        console.error('Error checking image upload permission:', error);
        setOwnPermission(false);
      } finally {
        setOwnLoading(false);
      }
    };

    checkImageUploadPermission();
  }, [user, useFamilyBased]);

  if (useFamilyBased) {
    return {
      isImageUploadEnabled: ownerHasUpload || ownerHasMemories,
      loading: familyLoading,
    };
  }

  return { isImageUploadEnabled: ownPermission, loading: ownLoading };
}