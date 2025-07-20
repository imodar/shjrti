-- Add the missing header tagline translation
INSERT INTO translations (key, value, language_code, category) VALUES
('site.tagline', 'Genealogy Management Platform', 'en', 'header'),
('site.tagline', 'منصة إدارة الأنساب', 'ar', 'header')
ON CONFLICT (language_code, key) DO UPDATE SET
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  updated_at = now();