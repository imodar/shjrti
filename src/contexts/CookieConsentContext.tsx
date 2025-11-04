import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CookiePreferences, CookieConsentContextType } from '@/types/cookies.types';

const STORAGE_KEY = 'cookie_consent_preferences';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load preferences from DB or localStorage
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        if (user) {
          // Load from database for authenticated users
          const { data, error } = await supabase
            .from('user_cookie_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            setPreferences({
              necessary: data.necessary,
              analytics: data.analytics,
              marketing: data.marketing,
              preferences: data.preferences,
            });
            setShowBanner(false);
          } else {
            // No preferences found, show banner
            setShowBanner(true);
          }
        } else {
          // Load from localStorage for visitors
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setPreferences(JSON.parse(stored));
            setShowBanner(false);
          } else {
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
        setShowBanner(true);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const hasConsent = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return !!stored || !showBanner;
  };

  const updateConsent = async (prefs: Partial<CookiePreferences>) => {
    const newPreferences = { ...preferences, ...prefs };
    setPreferences(newPreferences);
    setShowBanner(false);

    try {
      if (user) {
        // Save to database
        const { error } = await supabase
          .from('user_cookie_preferences')
          .upsert({
            user_id: user.id,
            necessary: newPreferences.necessary,
            analytics: newPreferences.analytics,
            marketing: newPreferences.marketing,
            preferences: newPreferences.preferences,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
      
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error updating cookie preferences:', error);
      // Still save to localStorage on error
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    }
  };

  const resetConsent = async () => {
    setPreferences(defaultPreferences);
    setShowBanner(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsent,
        updateConsent,
        resetConsent,
        showBanner,
        setShowBanner,
        loading,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsentContext() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsentContext must be used within CookieConsentProvider');
  }
  return context;
}
