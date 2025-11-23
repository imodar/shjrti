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

interface PageMetaTags {
  meta_title: {
    ar: string;
    en: string;
  };
  meta_description: {
    ar: string;
    en: string;
  };
  slug: string;
}

export const DynamicMetaTags = () => {
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const [settings, setSettings] = useState<SocialMediaSettings | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadSettings(), loadFamilyName(), loadPageMetaTags()]);
    };
    loadData();
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

  const loadPageMetaTags = async () => {
    try {
      // Extract slug from pathname
      const slug = location.pathname.substring(1); // Remove leading slash
      if (!slug || slug === '') return; // Skip homepage

      // Fetch meta tags for current page
      const { data, error } = await supabase
        .from('pages')
        .select('meta_title, meta_description, slug')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        console.log('[DynamicMetaTags] No meta tags found for page:', slug);
        return;
      }

      const pageMetaTags = data as PageMetaTags;
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      const lang = urlLang === 'en' || currentLanguage === 'en' ? 'en' : 'ar';
      
      const title = pageMetaTags.meta_title?.[lang] || pageMetaTags.meta_title?.ar;
      const description = pageMetaTags.meta_description?.[lang] || pageMetaTags.meta_description?.ar;
      
      if (title) {
        document.title = title;
        updateMetaTag('property', 'og:title', title);
        updateMetaTag('name', 'twitter:title', title);
      }
      
      if (description) {
        updateMetaTag('name', 'description', description);
        updateMetaTag('property', 'og:description', description);
        updateMetaTag('name', 'twitter:description', description);
      }
      
      console.log('[DynamicMetaTags] Updated meta tags for page:', slug);
    } catch (error) {
      console.error('[DynamicMetaTags] Error loading page meta tags:', error);
    }
  };

  useEffect(() => {
    // Only update title/meta tags when we have settings AND family name (if applicable)
    if (!settings) return;
    
    // Check if this is a /share or custom domain page that needs family name
    const pathParts = location.pathname.split('/');
    const customDomain = pathParts[1];
    const isSharePage = location.search.includes('token=');
    const isCustomDomain = customDomain && !PROTECTED_ROUTES.includes(customDomain.toLowerCase());
    
    // If it's a share/custom domain page, wait for family name to load
    if ((isSharePage || isCustomDomain) && !familyName) {
      return; // Don't update title until family name is loaded
    }

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
    
    // Add canonical URL
    updateCanonicalUrl(currentUrl);
    
    // Add hreflang tags
    updateHreflangTags();
    
  }, [settings, currentLanguage, location, familyName]);

  const updateCanonicalUrl = (url: string) => {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    
    canonicalLink.href = url;
  };

  const updateHreflangTags = () => {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.remove());
    
    // Add new hreflang tags
    const baseUrl = window.location.origin + window.location.pathname;
    
    const arLink = document.createElement('link');
    arLink.rel = 'alternate';
    arLink.hreflang = 'ar';
    arLink.href = baseUrl;
    document.head.appendChild(arLink);
    
    const enLink = document.createElement('link');
    enLink.rel = 'alternate';
    enLink.hreflang = 'en';
    enLink.href = `${baseUrl}?lang=en`;
    document.head.appendChild(enLink);
    
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = baseUrl;
    document.head.appendChild(defaultLink);
  };

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
