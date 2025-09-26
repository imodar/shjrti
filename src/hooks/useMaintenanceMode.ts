import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMaintenanceMode = () => {
  const { user, loading: authLoading } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check once after initial auth load
    if (authLoading) {
      return;
    }
    
    const checkMaintenanceMode = async () => {
      try {
        console.log('🔧 Checking maintenance mode...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Maintenance check timeout')), 5000)
        );
        
        const maintenancePromise = supabase.rpc('is_maintenance_mode_enabled');
        
        const { data, error } = await Promise.race([maintenancePromise, timeoutPromise]) as any;

        if (error) {
          console.error('Error checking maintenance mode:', error);
          setIsMaintenanceMode(false);
          return;
        }
        
        const maintenanceEnabled = Boolean(data);
        console.log('🔧 Maintenance mode status:', maintenanceEnabled);
        setIsMaintenanceMode(maintenanceEnabled);
      } catch (error) {
        console.error('Error checking maintenance mode (with timeout):', error);
        // Default to false if check fails
        setIsMaintenanceMode(false);
      } finally {
        console.log('🔧 Maintenance mode check completed');
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
          // Re-fetch using the secure function instead of parsing payload
          try {
            const { data, error } = await supabase.rpc('is_maintenance_mode_enabled');
            if (!error) {
              const enabled = Boolean(data);
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
  }, [authLoading]);

  return { isMaintenanceMode, loading };
};