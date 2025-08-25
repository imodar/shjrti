console.log('🔧 useMaintenanceMode file loaded');

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMaintenanceMode = () => {
  console.log('🔧 useMaintenanceMode: Hook initialized');
  
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 useMaintenanceMode: useEffect triggered');
    
    const checkMaintenanceMode = async () => {
      console.log('🔧 useMaintenanceMode: Checking maintenance mode from database');
      
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'maintenance_mode')
          .maybeSingle();

        console.log('🔧 useMaintenanceMode: Database response:', { data, error });

        if (error && error.code !== 'PGRST116') {
          console.error('🔧 useMaintenanceMode: Error checking maintenance mode:', error);
          return;
        }

        const settingValue = data?.setting_value as { enabled?: boolean } | null;
        const maintenanceEnabled = settingValue?.enabled || false;
        
        console.log('🔧 useMaintenanceMode: Loaded from DB:', {
          data,
          settingValue,
          maintenanceEnabled
        });
        
        setIsMaintenanceMode(maintenanceEnabled);
      } catch (error) {
        console.error('🔧 useMaintenanceMode: Error checking maintenance mode:', error);
        setIsMaintenanceMode(false);
      } finally {
        console.log('🔧 useMaintenanceMode: Setting loading to false');
        setLoading(false);
      }
    };

    checkMaintenanceMode();

    // Set up real-time subscription to admin_settings for maintenance_mode changes
    console.log('🔧 useMaintenanceMode: Setting up realtime subscription');
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
          console.log('🔧 useMaintenanceMode: Realtime update:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as { setting_value: { enabled?: boolean } };
            const enabled = newData.setting_value?.enabled || false;
            console.log('🔧 useMaintenanceMode: Setting maintenance mode to:', enabled);
            setIsMaintenanceMode(enabled);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔧 useMaintenanceMode: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  console.log('🔧 useMaintenanceMode: Current state:', { isMaintenanceMode, loading });
  return { isMaintenanceMode, loading };
};