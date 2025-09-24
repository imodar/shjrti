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
          .eq('setting_key', 'maintenance_mode')
          .single();

        if (error) {
          console.error('Error checking maintenance mode:', error);
          setIsMaintenanceMode(false);
          return;
        }

        console.log('🔧 Raw maintenance data:', data);
        
        // Get the setting_value object
        const settingValue = data?.setting_value;
        console.log('🔧 Setting value object:', settingValue);
        
        let maintenanceEnabled = false;
        if (settingValue && typeof settingValue === 'object' && 'enabled' in settingValue) {
          maintenanceEnabled = Boolean(settingValue.enabled);
        }
        
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
            const newData = payload.new as { setting_value: any };
            const settingValue = newData.setting_value;
            
            let enabled = false;
            if (settingValue && typeof settingValue === 'object' && 'enabled' in settingValue) {
              enabled = Boolean(settingValue.enabled);
            }
            
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