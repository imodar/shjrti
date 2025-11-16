import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublicSettings {
  recaptchaSiteKey: string | null;
  loading: boolean;
}

const PublicSettingsContext = createContext<PublicSettings>({
  recaptchaSiteKey: null,
  loading: true,
});

export function PublicSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>({
    recaptchaSiteKey: null,
    loading: true,
  });

  useEffect(() => {
    loadPublicSettings();
  }, []);

  const loadPublicSettings = async () => {
    try {
      // جلب إعدادات reCAPTCHA من admin_settings
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'recaptcha_public_settings')
        .single();

      if (error) {
        console.error('Error loading public settings:', error);
        // استخدام القيمة من .env كـ fallback
        setSettings({
          recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || null,
          loading: false,
        });
        return;
      }

      const settingsValue = data.setting_value as { siteKey?: string };
      
      setSettings({
        recaptchaSiteKey: settingsValue.siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY || null,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load public settings:', error);
      setSettings({
        recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || null,
        loading: false,
      });
    }
  };

  return (
    <PublicSettingsContext.Provider value={settings}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings() {
  const context = useContext(PublicSettingsContext);
  if (!context) {
    throw new Error('usePublicSettings must be used within PublicSettingsProvider');
  }
  return context;
}
