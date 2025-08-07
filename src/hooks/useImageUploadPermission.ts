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
        if (!isExpired) {
          setIsImageUploadEnabled(cachedPermission === 'true');
          setLoading(false);
          return;
        }
      }

      try {
        // Get user's subscription details with package info
        const { data: subscriptionData, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            packages (
              image_upload_enabled
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

        // If user has an active subscription with image upload enabled
        const hasPermission = Boolean(subscriptionData?.packages?.image_upload_enabled);
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