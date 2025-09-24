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
      // Reset admin state on user change to avoid stale values
      setIsAdmin(false);
      setAdminLoading(true);

      const checkAdminStatus = async () => {
        if (!user) {
          setIsAdmin(false);
          setAdminLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .rpc('is_admin_secure', { user_uuid: user.id });

          console.log('🔧 Admin check result:', { data, error, user_id: user.id });

          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            const isAdminResult = Boolean(data);
            console.log('🔧 Setting isAdmin to:', isAdminResult);
            setIsAdmin(isAdminResult);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setAdminLoading(false);
        }
      };

      checkAdminStatus();
    }, [user]);

    // Show loading while checking maintenance mode or admin status
    if (maintenanceLoading || authLoading || adminLoading) {
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
    console.log('🔧 MaintenanceGuard check:', { isMaintenanceMode, isAdmin, shouldShowMaintenance: isMaintenanceMode && !isAdmin });
    console.log('🔧 Detailed check - isMaintenanceMode:', isMaintenanceMode, 'type:', typeof isMaintenanceMode);
    console.log('🔧 Detailed check - isAdmin:', isAdmin, 'type:', typeof isAdmin);
    
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
