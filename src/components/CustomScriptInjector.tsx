import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Legacy component - loads all custom scripts without consent checking
 * Use ConsentAwareScriptInjector for consent-aware script loading
 */
export const CustomScriptInjector = () => {
  const { hasConsent } = useCookieConsent();
  useEffect(() => {
    let scriptContainer: HTMLDivElement | null = null;

    const loadAndInjectScript = async () => {
      // Wait for user to provide consent before loading any scripts
      if (!hasConsent()) {
        return;
      }

      try {
        // Load custom JavaScript from admin settings
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'custom_javascript')
          .maybeSingle();

        if (error) {
          return;
        }

        // Only proceed if we have actual data and code
        if (!data) {
          return; // No setting exists, nothing to inject
        }

        const settingValue = data.setting_value as { code?: string } | null;
        const customCode = settingValue?.code;

        // Remove any existing custom scripts
        const existingContainer = document.getElementById('custom-scripts-container');
        if (existingContainer) {
          existingContainer.remove();
        }

        // If there's custom code, inject it
        if (customCode && customCode.trim()) {
          scriptContainer = document.createElement('div');
          scriptContainer.id = 'custom-scripts-container';
          scriptContainer.innerHTML = customCode;
          
          // Append to head
          document.head.appendChild(scriptContainer);
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    // Load scripts on component mount and when consent changes
    loadAndInjectScript();

    // Cleanup function to remove scripts when component unmounts
    return () => {
      if (scriptContainer && scriptContainer.parentNode) {
        scriptContainer.parentNode.removeChild(scriptContainer);
      }
    };
  }, [hasConsent]);

  // This component doesn't render anything
  return null;
};

export default CustomScriptInjector;