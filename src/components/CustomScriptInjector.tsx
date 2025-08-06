import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const CustomScriptInjector = () => {
  useEffect(() => {
    let scriptContainer: HTMLDivElement | null = null;

    const loadAndInjectScript = async () => {
      try {
        // Load custom JavaScript from admin settings
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'custom_javascript')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading custom JavaScript:', error);
          return;
        }

        const settingValue = data?.setting_value as { code?: string } | null;
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
        console.error('Error injecting custom scripts:', error);
      }
    };

    // Load scripts on component mount
    loadAndInjectScript();

    // Cleanup function to remove scripts when component unmounts
    return () => {
      if (scriptContainer && scriptContainer.parentNode) {
        scriptContainer.parentNode.removeChild(scriptContainer);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default CustomScriptInjector;