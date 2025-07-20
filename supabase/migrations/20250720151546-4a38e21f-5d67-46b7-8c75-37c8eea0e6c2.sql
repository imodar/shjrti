-- Add missing navigation translation keys for GlobalHeader
INSERT INTO public.translations (language_code, key, value, category) VALUES
-- Arabic navigation translations
('ar', 'nav.menu', 'القائمة', 'navigation'),
('ar', 'nav.register_now', 'التسجيل الآن', 'navigation'),

-- English navigation translations  
('en', 'nav.menu', 'Menu', 'navigation'),
('en', 'nav.register_now', 'Register Now', 'navigation')
ON CONFLICT (language_code, key) DO NOTHING;