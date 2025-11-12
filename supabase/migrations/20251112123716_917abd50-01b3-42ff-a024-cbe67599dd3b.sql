-- Add missing reset_code_info translation key
INSERT INTO translations (key, value, language_code, category) VALUES
  ('reset_code_info', 'إذا كنت مسجلاً، سيصلك بريد إلكتروني يحتوي على رمز إعادة التعيين', 'ar', 'auth'),
  ('reset_code_info', 'If you are registered, you will receive an email containing the reset code', 'en', 'auth')
ON CONFLICT (key, language_code) DO UPDATE 
  SET value = EXCLUDED.value, updated_at = now();