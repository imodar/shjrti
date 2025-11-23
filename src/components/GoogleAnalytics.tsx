import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export const GoogleAnalytics = ({ measurementId }: GoogleAnalyticsProps) => {
  const { hasAnalytics } = useCookieConsent();

  // Update consent when user preferences change
  useEffect(() => {
    if (window.gtag && measurementId) {
      window.gtag('consent', 'update', {
        'analytics_storage': hasAnalytics ? 'granted' : 'denied',
        'ad_storage': hasAnalytics ? 'granted' : 'denied',
        'ad_user_data': hasAnalytics ? 'granted' : 'denied',
        'ad_personalization': hasAnalytics ? 'granted' : 'denied',
        'functionality_storage': hasAnalytics ? 'granted' : 'denied',
        'personalization_storage': hasAnalytics ? 'granted' : 'denied',
      });
    }
  }, [hasAnalytics, measurementId]);

  return null;
};

export default GoogleAnalytics;
