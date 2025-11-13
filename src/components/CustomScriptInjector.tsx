import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * @deprecated Legacy component - Use ConsentAwareScriptInjector for consent-aware script loading
 * 
 * CustomScriptInjector - Loads and injects custom JavaScript code into the application's head.
 * This component fetches custom JavaScript from Supabase and injects it into the DOM.
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * This component allows admins to inject arbitrary JavaScript that executes on all pages.
 * While properly protected by RLS policies (admin-only access), this feature has inherent risks:
 * 
 * RISKS:
 * - A compromised admin account could inject malicious scripts (XSS)
 * - Scripts execute with full user context and can access sensitive data
 * - No built-in sandboxing or script validation
 * - All users are affected by injected scripts
 * 
 * SECURITY MEASURES IN PLACE:
 * - RLS policies restrict custom_javascript modifications to verified admins only
 * - Scripts are loaded from Supabase database (not external URLs)
 * - Previous scripts are cleaned up before new injection
 * - Cookie consent required before script execution
 * 
 * RECOMMENDED ADDITIONAL HARDENING:
 * - Implement Content Security Policy (CSP) headers to restrict script capabilities
 * - Add admin action audit logging for all custom_javascript changes
 * - Consider integrity hash validation for injected scripts
 * - Limit script capabilities through CSP directives (no inline eval, external fetch restrictions)
 * - Require two-factor authentication for admin accounts
 * - Implement script review/approval workflow for high-security environments
 * 
 * USE ONLY IF:
 * - You fully trust all admin users with system-level access
 * - You have strong admin account security (2FA, password policies)
 * - You regularly audit admin actions and script changes
 * - You understand the security implications of arbitrary code execution
 */
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
      console.warn(`[CustomScriptInjector] Blocked script containing: ${name}`);
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
          console.error('[CustomScriptInjector] Failed to load custom scripts:', error);
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

        // If there's custom code, validate and inject it
        if (customCode && customCode.trim()) {
          // Validate the script before injection
          const validation = validateCustomScript(customCode);
          
          if (!validation.valid) {
            console.error('[CustomScriptInjector] Script validation failed:', validation.reason);
            return;
          }

          // Create container
          scriptContainer = document.createElement('div');
          scriptContainer.id = 'custom-scripts-container';
          scriptContainer.setAttribute('data-source', 'admin-custom-scripts');
          
          // Safely inject scripts using proper script tag creation
          injectScriptTags(customCode, scriptContainer);
          
          // Append to head
          document.head.appendChild(scriptContainer);
          
          console.info('[CustomScriptInjector] Custom scripts loaded successfully');
        }
      } catch (error) {
        console.error('[CustomScriptInjector] Error loading custom scripts:', error);
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