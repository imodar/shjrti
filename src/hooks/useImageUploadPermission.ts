import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useImageUploadPermission() {
  const { user } = useAuth();
  const [isImageUploadEnabled, setIsImageUploadEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkImageUploadPermission = async () => {
      if (!user) {
        setIsImageUploadEnabled(false);
        setLoading(false);
        return;
      }

      // Check cached permission first
      const cacheKey = `image_upload_permission_${user.id}`;
      const cachedPermission = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      
      // Use cache if it's less than 1 hour old
      if (cachedPermission && cacheTimestamp) {
        const isExpired = Date.now() - parseInt(cacheTimestamp) > 60 * 60 * 1000; // 1 hour
        // Trust cache only if it's TRUE and not expired, otherwise re-validate from server
        if (!isExpired && cachedPermission === 'true') {
          setIsImageUploadEnabled(true);
          setLoading(false);
          return;
        }
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
          setIsImageUploadEnabled(false);
          setLoading(false);
          return;
        }

        // If user has an active subscription, allow if either the boolean flag or the feature toggle is enabled
        const pkg: any = subscriptionData?.packages;
        const featureFlag = pkg?.features?.member_memories;
        const memberMemoriesEnabled = featureFlag === true || featureFlag === 'true' || featureFlag === 1;
        const hasPermission = Boolean(pkg?.image_upload_enabled) || memberMemoriesEnabled;
        setIsImageUploadEnabled(hasPermission);
        
        // Cache the result
        localStorage.setItem(cacheKey, hasPermission.toString());
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        
      } catch (error) {
        console.error('Error checking image upload permission:', error);
        setIsImageUploadEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkImageUploadPermission();
  }, [user]);

  return { isImageUploadEnabled, loading };
}