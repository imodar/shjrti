import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PROTECTED_ROUTES } from '@/constants/routes';

interface SocialMediaSettings {
  site_name: {
    ar: string;
    en: string;
  };
  default_description: {
    ar: string;
    en: string;
  };
  og_image_url: string | null;
  twitter_handle: string | null;
}

export const DynamicMetaTags = () => {
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const [settings, setSettings] = useState<SocialMediaSettings | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadFamilyName();
  }, [location]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_settings')
        .select('*')
        .maybeSingle();

      if (!error && data) {
        setSettings({
          site_name: data.site_name as { ar: string; en: string },
          default_description: data.default_description as { ar: string; en: string },
          og_image_url: data.og_image_url,
          twitter_handle: data.twitter_handle
        });
      }
    } catch (error) {
      console.error('Error loading social media settings:', error);
    }
  };

  const loadFamilyName = async () => {
    try {
      // Check if this is a custom domain route
      const pathParts = location.pathname.split('/');
      const customDomain = pathParts[1]; // Get first path segment
      
      // Only call edge function if it's NOT a protected app route
      if (customDomain && !PROTECTED_ROUTES.includes(customDomain.toLowerCase())) {
        // Try to fetch family by custom domain
        const { data, error } = await supabase.functions.invoke('custom-domain-redirect', {
          body: { customDomain }
        });
        
        if (!error && data?.data?.family) {
          setFamilyName(data.data.family.name);
        }
      } else if (location.search.includes('token=')) {
        // Try to fetch family by share token
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        
        if (token) {
          const { data, error } = await supabase.functions.invoke('get-shared-family', {
            body: { share_token: token }
          });
          
          if (!error && data?.data?.family) {
            setFamilyName(data.data.family.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading family name:', error);
    }
  };

  useEffect(() => {
    if (!settings) return;

    const currentUrl = window.location.href;
    
    // Default to Arabic unless current language is explicitly English or ?lang=en in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const lang = urlLang === 'en' || currentLanguage === 'en' ? 'en' : 'ar';
    
    // Get base title from settings
    let title = settings.site_name[lang];
    
    // If we have a family name, append it
    if (familyName) {
      title = `${title} - ${lang === 'ar' ? 'عائلة' : 'Family'} ${familyName}`;
    }
    
    const description = settings.default_description[lang];
    const imageUrl = settings.og_image_url || 'https://lovable.dev/opengraph-image-p98pqg.png';
    
    // Update document title
    document.title = title;
    
    // Update or create Open Graph meta tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('property', 'og:image', imageUrl);
    updateMetaTag('property', 'og:type', 'website');
    
    // Update Twitter Card meta tags
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', imageUrl);
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    
    if (settings.twitter_handle) {
      updateMetaTag('name', 'twitter:site', settings.twitter_handle);
    }
    
    // Update regular meta description
    updateMetaTag('name', 'description', description);
    
  }, [settings, currentLanguage, location, familyName]);

  const updateMetaTag = (attribute: 'property' | 'name', value: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${value}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, value);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  return null;
};
