import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

interface DynamicMetaTagsProps {
  familyId?: string;
  familyName?: string;
  familyDescription?: string;
}

interface OGSettings {
  og_site_name: string;
  og_default_description: string;
  og_image_url: string;
  twitter_site: string;
}

export function DynamicMetaTags({ familyId, familyName, familyDescription }: DynamicMetaTagsProps) {
  const [settings, setSettings] = useState<OGSettings>({
    og_site_name: 'منصة شجرتي',
    og_default_description: 'اكتشف تاريخ العائلة وشجرة الأنساب الكاملة',
    og_image_url: 'https://lovable.dev/opengraph-image-p98pqg.png',
    twitter_site: '@shjrti',
  });

  useEffect(() => {
    loadOGSettings();
  }, []);

  const loadOGSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['og_site_name', 'og_default_description', 'og_image_url', 'twitter_site']);

      if (!error && data) {
        const loadedSettings: any = { ...settings };
        data.forEach(item => {
          loadedSettings[item.setting_key] = item.setting_value;
        });
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading OG settings:', error);
    }
  };

  // Build dynamic title and description
  const title = familyName 
    ? `${settings.og_site_name} - عائلة ${familyName}`
    : settings.og_site_name;

  const description = familyDescription || settings.og_default_description;
  const imageUrl = settings.og_image_url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={settings.og_site_name} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content={settings.twitter_site} />
    </Helmet>
  );
}
