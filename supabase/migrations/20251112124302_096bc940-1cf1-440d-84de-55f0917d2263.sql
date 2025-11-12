-- Add missing translations for keys that exist in only one language
INSERT INTO translations (key, value, language_code, category) VALUES
  -- Family relations (missing English)
  ('aunt', 'Aunt', 'en', 'family'),
  ('brother', 'Brother', 'en', 'family'),
  ('daughter', 'Daughter', 'en', 'family'),
  ('father', 'Father', 'en', 'family'),
  ('grandfather', 'Grandfather', 'en', 'family'),
  ('grandmother', 'Grandmother', 'en', 'family'),
  ('husband', 'Husband', 'en', 'family'),
  ('mother', 'Mother', 'en', 'family'),
  ('sister', 'Sister', 'en', 'family'),
  ('son', 'Son', 'en', 'family'),
  ('uncle', 'Uncle', 'en', 'family'),
  ('wife', 'Wife', 'en', 'family'),
  
  -- Auth messages (missing Arabic)
  ('email_not_confirmed', 'البريد الإلكتروني غير مؤكد', 'ar', 'auth'),
  ('enter_code_instruction', 'يرجى إدخال الرمز المرسل إلى بريدك الإلكتروني', 'ar', 'auth'),
  ('login_error', 'خطأ في تسجيل الدخول', 'ar', 'auth'),
  ('login_successful', 'تم تسجيل الدخول بنجاح', 'ar', 'auth'),
  ('phone', 'رقم الهاتف', 'ar', 'auth'),
  ('sending_error', 'خطأ في الإرسال', 'ar', 'auth'),
  ('verification_code_sent', 'تم إرسال رمز التحقق', 'ar', 'auth'),
  ('welcome', 'مرحباً بك', 'ar', 'auth'),
  ('will_send_verification_code', 'سنرسل لك رمز تحقق جديد', 'ar', 'auth')
ON CONFLICT (key, language_code) DO UPDATE 
  SET value = EXCLUDED.value, updated_at = now();