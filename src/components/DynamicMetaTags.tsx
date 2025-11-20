import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

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

  useEffect(() => {
    loadSettings();
  }, []);

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

  useEffect(() => {
    if (!settings) return;

    const currentUrl = window.location.href;
    
    // Default to Arabic unless current language is explicitly English or ?lang=en in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const lang = urlLang === 'en' || currentLanguage === 'en' ? 'en' : 'ar';
    
    // Get title and description based on determined language
    const title = settings.site_name[lang];
    const description = settings.default_description[lang];
    const imageUrl = settings.og_image_url || 'https://lovable.dev/opengraph-image-p98pqg.png';
    
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
    
  }, [settings, currentLanguage, location]);

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
