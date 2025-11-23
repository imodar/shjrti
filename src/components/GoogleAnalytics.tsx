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

  useEffect(() => {
    // Don't load if no measurementId provided
    if (!measurementId) return;

    // Check if already loaded
    if (document.getElementById('ga-script')) {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };

    // Set default consent mode BEFORE loading gtag script (Google Consent Mode v2)
    window.gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'personalization_storage': 'denied',
      'functionality_storage': 'denied',
      'security_storage': 'granted', // Always granted for security
    });

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true, // Anonymize IPs for GDPR compliance
      cookie_flags: 'SameSite=None;Secure',
    });

    // Load GA script - ALWAYS load regardless of consent
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const gaScript = document.getElementById('ga-script');
      if (gaScript) {
        gaScript.remove();
      }
    };
  }, [measurementId]);

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
