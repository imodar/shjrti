import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { supabase } from '@/integrations/supabase/client';

export const ConsentAwareScriptInjector = () => {
  const { hasAnalytics, hasMarketing, hasPreferences } = useCookieConsent();

  useEffect(() => {
    let scriptContainer: HTMLDivElement | null = null;

    const loadAndInjectScripts = async () => {
      try {
        // Load custom JavaScript from admin settings
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'custom_javascript')
          .maybeSingle();

        if (error || !data) {
          return;
        }

        const settingValue = data.setting_value as { code?: string; type?: string } | null;
        const customCode = settingValue?.code;
        const scriptType = settingValue?.type || 'necessary'; // necessary, analytics, marketing, preferences

        // Remove any existing custom scripts
        const existingContainer = document.getElementById('consent-aware-scripts-container');
        if (existingContainer) {
          existingContainer.remove();
        }

        // Check if we should inject based on consent and script type
        let shouldInject = false;
        switch (scriptType) {
          case 'necessary':
            shouldInject = true; // Always inject necessary scripts
            break;
          case 'analytics':
            shouldInject = hasAnalytics;
            break;
          case 'marketing':
            shouldInject = hasMarketing;
            break;
          case 'preferences':
            shouldInject = hasPreferences;
            break;
          default:
            shouldInject = true;
        }

        // If there's custom code and consent is granted, inject it
        if (customCode && customCode.trim() && shouldInject) {
          scriptContainer = document.createElement('div');
          scriptContainer.id = 'consent-aware-scripts-container';
          scriptContainer.innerHTML = customCode;
          
          document.head.appendChild(scriptContainer);
        }
      } catch (error) {
        console.error('Error loading consent-aware scripts:', error);
      }
    };

    loadAndInjectScripts();

    return () => {
      if (scriptContainer && scriptContainer.parentNode) {
        scriptContainer.parentNode.removeChild(scriptContainer);
      }
    };
  }, [hasAnalytics, hasMarketing, hasPreferences]);

  return null;
};

export default ConsentAwareScriptInjector;
