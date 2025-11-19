import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates custom JavaScript code for basic security patterns
 * @param code - The JavaScript code to validate
 * @returns { valid: boolean, reason?: string }
 */
const validateCustomScript = (code: string): { valid: boolean; reason?: string } => {
  if (!code || code.trim().length === 0) {
    return { valid: false, reason: 'Empty script' };
  }

  // Check for extremely dangerous patterns
  const dangerousPatterns = [
    { pattern: /document\.cookie\s*=/gi, name: 'Direct cookie manipulation' },
    { pattern: /localStorage\.clear\(\)/gi, name: 'LocalStorage clearing' },
    { pattern: /sessionStorage\.clear\(\)/gi, name: 'SessionStorage clearing' },
    { pattern: /<iframe[^>]*srcdoc=/gi, name: 'Inline iframe with srcdoc' },
  ];

  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(code)) {
      console.warn(`[ConsentAwareScriptInjector] Blocked script containing: ${name}`);
      return { valid: false, reason: `Contains potentially dangerous pattern: ${name}` };
    }
  }

  return { valid: true };
};

/**
 * Safely injects script tags from HTML string
 * @param htmlString - HTML string potentially containing script tags
 * @param container - Container element to append scripts to
 */
const injectScriptTags = (htmlString: string, container: HTMLElement): void => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  // Find all script tags
  const scripts = tempDiv.querySelectorAll('script');
  
  scripts.forEach((oldScript) => {
    // Create new script element (necessary for execution)
    const newScript = document.createElement('script');
    
    // Copy attributes
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    
    // Copy inline code if present
    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent;
    }
    
    container.appendChild(newScript);
  });
  
  // Inject non-script elements (e.g., style tags, meta tags)
  const nonScripts = Array.from(tempDiv.children).filter(
    (el) => el.tagName.toLowerCase() !== 'script'
  );
  
  nonScripts.forEach((el) => {
    container.appendChild(el.cloneNode(true));
  });
};

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

        // If there's custom code and consent is granted, validate and inject it
        if (customCode && customCode.trim() && shouldInject) {
          // Validate the script before injection
          const validation = validateCustomScript(customCode);
          
          if (!validation.valid) {
            console.error('[ConsentAwareScriptInjector] Script validation failed:', validation.reason);
            return;
          }

          // Create container
          scriptContainer = document.createElement('div');
          scriptContainer.id = 'consent-aware-scripts-container';
          scriptContainer.setAttribute('data-source', 'admin-custom-scripts-consent-aware');
          scriptContainer.setAttribute('data-type', scriptType);
          
          // Safely inject scripts using proper script tag creation
          injectScriptTags(customCode, scriptContainer);
          
          // Append to head
          document.head.appendChild(scriptContainer);
          
          console.info(`[ConsentAwareScriptInjector] Custom scripts (${scriptType}) loaded successfully`);
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
