-- Add translations for family_header.suggestions
INSERT INTO public.translations (key, language_code, value, category)
VALUES 
  ('family_header.suggestions', 'ar', 'الاقتراحات', 'family_header'),
  ('family_header.suggestions', 'en', 'Suggestions', 'family_header')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value, updated_at = now();