-- Add missing translation keys for Auth page
INSERT INTO translations (key, value, language_code, category) VALUES
  ('login_via_otp', 'تسجيل الدخول بواسطة رمز مؤقت', 'ar', 'auth'),
  ('login_via_otp', 'Login with temporary code', 'en', 'auth')
ON CONFLICT (key, language_code) DO UPDATE 
  SET value = EXCLUDED.value, updated_at = now();