-- Add 404 error page translations
INSERT INTO translations (key, language_code, category, value) VALUES
  -- Arabic translations
  ('error_404.title', 'ar', 'errors', 'عفواً، لقد اتبعت رابطاً غير صحيح'),
  ('error_404.description', 'ar', 'errors', 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها'),
  ('error_404.back_to_home', 'ar', 'errors', 'العودة للصفحة الرئيسية'),
  
  -- English translations
  ('error_404.title', 'en', 'errors', 'Sorry, you followed an incorrect link'),
  ('error_404.description', 'en', 'errors', 'The page you are looking for does not exist or has been moved'),
  ('error_404.back_to_home', 'en', 'errors', 'Return to Home')
ON CONFLICT (key, language_code) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();