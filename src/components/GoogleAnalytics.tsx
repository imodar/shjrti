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
    // Only load GA if user has consented to analytics and measurementId is provided
    if (!hasAnalytics || !measurementId) {
      // Remove GA scripts if consent is revoked
      const existingScript = document.getElementById('ga-script');
      const existingConfigScript = document.getElementById('ga-config');
      if (existingScript) existingScript.remove();
      if (existingConfigScript) existingConfigScript.remove();
      
      // Clear dataLayer
      if (window.dataLayer) {
        window.dataLayer = [];
      }
      return;
    }

    // Check if already loaded
    if (document.getElementById('ga-script')) {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true, // Anonymize IPs for GDPR compliance
      cookie_flags: 'SameSite=None;Secure',
    });

    // Load GA script
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
  }, [hasAnalytics, measurementId]);

  return null;
};

export default GoogleAnalytics;
