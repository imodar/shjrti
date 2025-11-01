import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useAdmin } from '@/contexts/AdminContext';
import MaintenancePage from '@/pages/MaintenancePage';

interface MaintenanceModeGuardProps {
  children: React.ReactNode;
}

export const MaintenanceModeGuard = ({ children }: MaintenanceModeGuardProps) => {
  try {
    const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
    const { isAdmin, loading: adminLoading } = useAdmin();

    // Show children immediately while loading - don't block the app
    // This is especially important for public pages like /tree
    if (maintenanceLoading || adminLoading) {
      return <>{children}</>;
    }

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
