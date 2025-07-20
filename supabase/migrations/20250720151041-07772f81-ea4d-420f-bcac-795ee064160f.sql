-- Ensure login and email translation keys exist
INSERT INTO public.translations (language_code, key, value, category) VALUES
('ar', 'login', 'تسجيل الدخول', 'auth'),
('ar', 'email', 'البريد الإلكتروني', 'auth'),
('en', 'login', 'Login', 'auth'),
('en', 'email', 'Email', 'auth')
ON CONFLICT (language_code, key) DO NOTHING;