-- Phase 2: Create seo_settings table for homepage meta tags
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_title JSONB NOT NULL DEFAULT '{"ar": "منصة شجرتي - ابني شجرة عائلتك", "en": "Shejrati Platform - Build Your Family Tree"}'::jsonb,
  homepage_description JSONB NOT NULL DEFAULT '{"ar": "منصة عربية متخصصة في بناء وحفظ شجرة العائلة مع أدوات ذكية وتقنيات حديثة", "en": "Arabic platform specialized in building and preserving family trees with smart tools and modern technologies"}'::jsonb,
  homepage_keywords JSONB NOT NULL DEFAULT '{"ar": "شجرة العائلة، أنساب، عائلة، تاريخ العائلة", "en": "family tree, genealogy, ancestry, family history"}'::jsonb,
  organization_name JSONB NOT NULL DEFAULT '{"ar": "منصة شجرتي", "en": "Shejrati Platform"}'::jsonb,
  organization_logo_url TEXT,
  organization_social_links JSONB DEFAULT '[]'::jsonb,
  enable_search_action BOOLEAN DEFAULT true,
  theme_color TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.seo_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SEO settings"
ON public.seo_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read SEO settings"
ON public.seo_settings
FOR SELECT
TO public
USING (true);

-- Phase 3: Update pages table for meta tags
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS meta_title JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS meta_description JSONB DEFAULT '{}'::jsonb;

-- Update existing pages with default meta tags
UPDATE public.pages
SET 
  meta_title = jsonb_build_object(
    'ar', COALESCE(title->>'ar', 'شجرتي'),
    'en', COALESCE(title->>'en', 'Shejrati')
  ),
  meta_description = jsonb_build_object(
    'ar', COALESCE(
      (content->>'ar')::text,
      'منصة شجرتي - ابني شجرة عائلتك'
    ),
    'en', COALESCE(
      (content->>'en')::text,
      'Shejrati Platform - Build Your Family Tree'
    )
  )
WHERE meta_title IS NULL OR meta_description IS NULL;

-- Phase 4: Create structured_data table for JSON-LD schemas
CREATE TABLE IF NOT EXISTS public.structured_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type TEXT NOT NULL, -- 'Organization', 'WebSite', 'BreadcrumbList'
  schema_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  page_slug TEXT, -- NULL for global schemas like Organization
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schema_type, page_slug)
);

-- Insert default Organization schema
INSERT INTO public.structured_data (schema_type, schema_data, page_slug)
VALUES (
  'Organization',
  '{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "منصة شجرتي",
    "alternateName": "Shejrati Platform",
    "url": "https://shjrti.com",
    "description": "منصة عربية متخصصة في بناء وحفظ شجرة العائلة"
  }'::jsonb,
  NULL
)
ON CONFLICT (schema_type, page_slug) DO NOTHING;

-- Insert default WebSite schema with SearchAction
INSERT INTO public.structured_data (schema_type, schema_data, page_slug)
VALUES (
  'WebSite',
  '{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "منصة شجرتي",
    "url": "https://shjrti.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://shjrti.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }'::jsonb,
  NULL
)
ON CONFLICT (schema_type, page_slug) DO NOTHING;

-- RLS Policies for structured_data
ALTER TABLE public.structured_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage structured data"
ON public.structured_data
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read active structured data"
ON public.structured_data
FOR SELECT
TO public
USING (is_active = true);

-- Phase 9: Create robots_txt_settings table
CREATE TABLE IF NOT EXISTS public.robots_txt_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL DEFAULT 'User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

Sitemap: https://shjrti.com/sitemap.xml',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default robots.txt content
INSERT INTO public.robots_txt_settings (id)
VALUES ('00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE public.robots_txt_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage robots.txt"
ON public.robots_txt_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read active robots.txt"
ON public.robots_txt_settings
FOR SELECT
TO public
USING (is_active = true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_settings_updated_at
BEFORE UPDATE ON public.seo_settings
FOR EACH ROW
EXECUTE FUNCTION update_seo_updated_at();

CREATE TRIGGER structured_data_updated_at
BEFORE UPDATE ON public.structured_data
FOR EACH ROW
EXECUTE FUNCTION update_seo_updated_at();

CREATE TRIGGER robots_txt_settings_updated_at
BEFORE UPDATE ON public.robots_txt_settings
FOR EACH ROW
EXECUTE FUNCTION update_seo_updated_at();