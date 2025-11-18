-- إضافة جدول لإعدادات Open Graph
CREATE TABLE IF NOT EXISTS social_media_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name JSONB NOT NULL DEFAULT '{"ar": "منصة شجرتي", "en": "Shejrati Platform"}'::jsonb,
  default_description JSONB NOT NULL DEFAULT '{"ar": "منصة عربية متخصصة في بناء وحفظ شجرة العائلة", "en": "Arabic platform specialized in building and preserving family trees"}'::jsonb,
  og_image_url TEXT,
  twitter_handle TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage social media settings"
ON social_media_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read social media settings"
ON social_media_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- إدراج القيم الافتراضية
INSERT INTO social_media_settings (site_name, default_description)
VALUES (
  '{"ar": "منصة شجرتي", "en": "Shejrati Platform"}'::jsonb,
  '{"ar": "منصة عربية متخصصة في بناء وحفظ شجرة العائلة", "en": "Arabic platform specialized in building and preserving family trees"}'::jsonb
)
ON CONFLICT DO NOTHING;