import { useEffect } from 'react';
import { useCookieConsent } from './useCookieConsent';

/**
 * Hook to track analytics and marketing events based on user consent
 */
export function useTrackingConsent() {
  const { hasAnalytics, hasMarketing, hasPreferences } = useCookieConsent();

  // Track analytics event (only if consent given)
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (!hasAnalytics) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  };

  // Track page view (only if consent given)
  const trackPageView = (path: string, title?: string) => {
    if (!hasAnalytics) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    }
  };

  // Track marketing conversion (only if consent given)
  const trackConversion = (conversionId: string, conversionData?: Record<string, any>) => {
    if (!hasMarketing) return;

    // Google Ads conversion tracking
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: conversionId,
        ...conversionData,
      });
    }
  };

  // Update consent mode for Google Analytics
  useEffect(() => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: hasAnalytics ? 'granted' : 'denied',
        ad_storage: hasMarketing ? 'granted' : 'denied',
        ad_user_data: hasMarketing ? 'granted' : 'denied',
        ad_personalization: hasMarketing ? 'granted' : 'denied',
        functionality_storage: hasPreferences ? 'granted' : 'denied',
        personalization_storage: hasPreferences ? 'granted' : 'denied',
      });
    }
  }, [hasAnalytics, hasMarketing, hasPreferences]);

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    hasAnalytics,
    hasMarketing,
    hasPreferences,
  };
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
