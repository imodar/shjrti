export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsentContextType {
  preferences: CookiePreferences;
  hasConsent: () => boolean;
  updateConsent: (prefs: Partial<CookiePreferences>) => Promise<void>;
  resetConsent: () => Promise<void>;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  loading: boolean;
}

export interface CookieType {
  key: keyof CookiePreferences;
  required?: boolean;
}
