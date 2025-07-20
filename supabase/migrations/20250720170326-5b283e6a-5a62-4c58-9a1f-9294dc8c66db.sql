-- Update website name translations
UPDATE translations 
SET value = 'Shjrti'
WHERE key = 'site.name' AND language_code = 'en';

UPDATE translations 
SET value = 'شجرتي'
WHERE key = 'site.name' AND language_code = 'ar';

-- Insert if not exists
INSERT INTO translations (key, value, language_code, category)
VALUES 
  ('site.name', 'Shjrti', 'en', 'header'),
  ('site.name', 'شجرتي', 'ar', 'header')
ON CONFLICT (key, language_code) 
DO UPDATE SET value = EXCLUDED.value, updated_at = now();