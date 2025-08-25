import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMaintenanceMode = () => {
  const { user, loading: authLoading } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before checking maintenance mode
    if (authLoading) {
      return;
    }
    
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'maintenance_mode');

        if (error) {
          console.error('Error checking maintenance mode:', error);
          return;
        }

        // Handle both array and single object responses
        const settingData = Array.isArray(data) ? data[0] : data;
        const settingValue = settingData?.setting_value as { enabled?: boolean } | null;
        const maintenanceEnabled = settingValue?.enabled || false;
        
        console.log('🔧 Maintenance mode set to:', maintenanceEnabled);
        setIsMaintenanceMode(maintenanceEnabled);
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        setIsMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();

    // Set up real-time subscription to admin_settings for maintenance_mode changes
    const subscription = supabase
      .channel('maintenance_mode_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_settings',
          filter: `setting_key=eq.maintenance_mode`
        },
        (payload) => {
          console.log('🔧 Real-time update received:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as { setting_value: { enabled?: boolean } };
            const enabled = newData.setting_value?.enabled || false;
            console.log('🔧 Real-time maintenance mode update:', enabled);
            setIsMaintenanceMode(enabled);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [authLoading, user]);

  return { isMaintenanceMode, loading };
};