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
        if (subscriptionData?.packages?.image_upload_enabled) {
          setIsImageUploadEnabled(true);
        } else {
          // User is on free plan or plan without image upload
          setIsImageUploadEnabled(false);
        }
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