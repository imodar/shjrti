console.log('🔧 MaintenanceModeGuard file loaded');

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
  console.log('🔧 MaintenanceModeGuard: Component mounted');
  
  try {
    const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLoading, setAdminLoading] = useState(true);

    useEffect(() => {
      console.log('🔧 MaintenanceModeGuard: useEffect triggered');
      
      const checkAdminStatus = async () => {
        console.log('🔧 MaintenanceModeGuard: Checking admin status for user:', user?.email);
        
        if (!user) {
          console.log('🔧 MaintenanceModeGuard: No user found, setting isAdmin to false');
          setIsAdmin(false);
          setAdminLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .rpc('is_admin_secure', { user_uuid: user.id });

          console.log('🔧 MaintenanceModeGuard: Admin check result:', { data, error });

          if (error) {
            console.error('🔧 MaintenanceModeGuard: Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data || false);
            console.log('🔧 MaintenanceModeGuard: User is admin:', data || false);
          }
        } catch (error) {
          console.error('🔧 MaintenanceModeGuard: Error checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setAdminLoading(false);
        }
      };

      checkAdminStatus();
    }, [user]);

    // Debug logging
    console.log('🔧 MaintenanceModeGuard Debug:', {
      isMaintenanceMode,
      maintenanceLoading,
      authLoading,
      adminLoading,
      isAdmin,
      user: user?.email
    });

    // Show loading while checking maintenance mode or admin status
    if (maintenanceLoading || authLoading || adminLoading) {
      console.log('🔧 MaintenanceModeGuard: Showing loading state');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      );
    }

    // If maintenance mode is enabled and user is not admin, show maintenance page
    if (isMaintenanceMode && !isAdmin) {
      console.log('🔧 MaintenanceModeGuard: Showing maintenance page');
      return <MaintenancePage />;
    }

    console.log('🔧 MaintenanceModeGuard: Allowing access to app');
    // Otherwise, render the app normally
    return <>{children}</>;
  } catch (error) {
    console.error('🔧 MaintenanceModeGuard: Critical error:', error);
    // Fallback to render children if there's an error
    return <>{children}</>;
  }
};
