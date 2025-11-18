-- Add missing translation key for "and"
INSERT INTO public.translations (key, language_code, category, value) VALUES
('common.and', 'ar', 'common', 'و'),
('common.and', 'en', 'common', 'and')
ON CONFLICT (key, language_code) DO NOTHING;