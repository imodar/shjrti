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

      // Clear cache to force fresh check
      const cacheKey = `image_upload_permission_${user.id}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_timestamp`);
      
      console.log('🔍 Checking image upload permission for user:', user.id);

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

        console.log('📦 Subscription data:', subscriptionData);
        console.log('📋 Package data:', subscriptionData?.packages);

        // If user has an active subscription, allow if either the boolean flag or the feature toggle is enabled
        const pkg: any = subscriptionData?.packages;
        const featureFlag = pkg?.features?.member_memories;
        const memberMemoriesEnabled = featureFlag === true || featureFlag === 'true' || featureFlag === 1;
        const hasPermission = Boolean(pkg?.image_upload_enabled) || memberMemoriesEnabled;
        
        console.log('🎛️ Image upload enabled (boolean):', pkg?.image_upload_enabled);
        console.log('🎛️ Feature flag value:', featureFlag);
        console.log('🎛️ Member memories enabled:', memberMemoriesEnabled);
        console.log('✅ Final permission result:', hasPermission);
        
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