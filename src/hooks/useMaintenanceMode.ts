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
        console.log('🔧 Checking maintenance mode using is_maintenance_mode_enabled function');
        const { data, error } = await supabase
          .rpc('is_maintenance_mode_enabled');

        if (error) {
          console.error('Error checking maintenance mode:', error);
          setIsMaintenanceMode(false);
          return;
        }

        console.log('🔧 Raw maintenance data from function:', data);
        
        const maintenanceEnabled = Boolean(data);
        
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
        async (payload) => {
          console.log('🔧 Real-time update received:', payload);
          // Re-fetch using the secure function instead of parsing payload
          try {
            const { data, error } = await supabase.rpc('is_maintenance_mode_enabled');
            if (!error) {
              const enabled = Boolean(data);
              console.log('🔧 Real-time maintenance mode update:', enabled);
              setIsMaintenanceMode(enabled);
            }
          } catch (error) {
            console.error('Error in real-time maintenance mode update:', error);
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