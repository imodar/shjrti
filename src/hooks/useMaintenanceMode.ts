import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'maintenance_mode')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking maintenance mode:', error);
          return;
        }

        const settingValue = data?.setting_value as { enabled?: boolean } | null;
        setIsMaintenanceMode(settingValue?.enabled || false);
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
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as { setting_value: { enabled?: boolean } };
            setIsMaintenanceMode(newData.setting_value?.enabled || false);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isMaintenanceMode, loading };
};