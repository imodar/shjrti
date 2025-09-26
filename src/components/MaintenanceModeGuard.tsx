import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import MaintenancePage from '@/pages/MaintenancePage';

interface MaintenanceModeGuardProps {
  children: React.ReactNode;
}

export const MaintenanceModeGuard = ({ children }: MaintenanceModeGuardProps) => {
  try {
    const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLoading, setAdminLoading] = useState(true);

    useEffect(() => {
      let isMounted = true;
      
      const checkAdminStatus = async () => {
        if (!user) {
          if (isMounted) {
            setIsAdmin(false);
            setAdminLoading(false);
          }
          return;
        }

        try {
          const { data, error } = await supabase
            .rpc('is_admin_secure', { user_uuid: user.id });

          if (!isMounted) return;

          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            const rawData: any = data;
            let isAdminResult = false;
            // Normalize various possible return shapes
            if (rawData === true) {
              isAdminResult = true;
            } else if (typeof rawData === 'string') {
              isAdminResult = rawData.toLowerCase() === 'true' || rawData === 't';
            } else if (typeof rawData === 'number') {
              isAdminResult = rawData === 1;
            } else if (rawData && typeof rawData === 'object') {
              // Some PostgREST configs wrap scalars
              if ('is_admin_secure' in rawData) {
                const val: any = rawData.is_admin_secure;
                isAdminResult = val === true || val === 'true' || val === 't' || val === 1;
              }
            }
            setIsAdmin(isAdminResult);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          if (isMounted) {
            setIsAdmin(false);
          }
        } finally {
          if (isMounted) {
            setAdminLoading(false);
          }
        }
      };

      checkAdminStatus();
      
      return () => {
        isMounted = false;
      };
    }, [user?.id]);

    // Silent loading - let the app render while checking in background

    // If maintenance mode is enabled and user is not admin, show maintenance page
    
    if (isMaintenanceMode && !isAdmin) {
      console.log('🔧 Showing maintenance page');
      return <MaintenancePage />;
    }

    // Otherwise, render the app normally
    return <>{children}</>;
  } catch (error) {
    console.error('MaintenanceModeGuard: Critical error:', error);
    // Fallback to render children if there's an error
    return <>{children}</>;
  }
};
