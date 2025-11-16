import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTrackingConsent } from '@/hooks/useTrackingConsent';

/**
 * Component that tracks page views in Google Analytics on route changes
 * Respects user's cookie consent preferences
 */
export const PageViewTracker = () => {
  const location = useLocation();
  const { trackPageView, hasAnalytics } = useTrackingConsent();

  useEffect(() => {
    if (hasAnalytics) {
      // Get page title from document or generate from path
      const pageTitle = document.title || getPageTitleFromPath(location.pathname);
      
      // Track the page view with full path including search params
      trackPageView(
        location.pathname + location.search,
        pageTitle
      );
    }
  }, [location, trackPageView, hasAnalytics]);

  return null;
};

// Helper function to generate readable page titles from paths
function getPageTitleFromPath(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Home',
    '/dashboard': 'Dashboard',
    '/dashboard-backup': 'Dashboard Backup',
    '/family-creator': 'Family Creator',
    '/family-builder': 'Family Builder',
    '/family-builder-new': 'Family Builder New',
    '/family-tree-view': 'Family Tree View',
    '/family-statistics': 'Family Statistics',
    '/family-gallery': 'Family Gallery',
    '/profile': 'Profile',
    '/payments': 'Payments',
    '/plan-selection': 'Plan Selection',
    '/payment-success': 'Payment Success',
    '/payment': 'Payment',
    '/change-password': 'Change Password',
    '/terms-conditions': 'Terms & Conditions',
    '/privacy-policy': 'Privacy Policy',
    '/contact-us': 'Contact Us',
    '/store': 'Store',
    '/admin': 'Admin Panel',
    '/admin/billing': 'Admin Billing',
    '/renew-subscription': 'Renew Subscription',
    '/public-tree': 'Public Tree View',
    '/auth': 'Authentication',
  };
  
  return routes[pathname] || pathname;
}

export default PageViewTracker;
