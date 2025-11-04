import { useCookieConsentContext } from '@/contexts/CookieConsentContext';

export function useCookieConsent() {
  const {
    preferences,
    hasConsent,
    updateConsent,
    resetConsent,
    showBanner,
    setShowBanner,
    loading,
  } = useCookieConsentContext();

  return {
    hasNecessary: preferences.necessary,
    hasAnalytics: preferences.analytics,
    hasMarketing: preferences.marketing,
    hasPreferences: preferences.preferences,
    hasConsent,
    updatePreferences: updateConsent,
    resetConsent,
    showBanner,
    setShowBanner,
    isLoading: loading,
  };
}
