-- Add remaining Auth page translation keys
INSERT INTO translations (key, value, language_code, category) VALUES
  ('logging_in', 'جاري تسجيل الدخول...', 'ar', 'auth'),
  ('logging_in', 'Logging in...', 'en', 'auth'),
  ('or', 'أو', 'ar', 'auth'),
  ('or', 'Or', 'en', 'auth'),
  ('continue_with_google', 'متابعة مع Google', 'ar', 'auth'),
  ('continue_with_google', 'Continue with Google', 'en', 'auth')
ON CONFLICT (key, language_code) DO UPDATE 
  SET value = EXCLUDED.value, updated_at = now();