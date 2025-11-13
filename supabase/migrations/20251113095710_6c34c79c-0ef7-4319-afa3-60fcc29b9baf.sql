-- Add OTP error message translations
INSERT INTO translations (language_code, key, value) VALUES
-- Arabic translations
('ar', 'otp_invalid_or_expired', 'رمز التحقق غير صحيح أو منتهي الصلاحية'),
('ar', 'otp_verification_failed', 'فشل التحقق من الرمز'),
('ar', 'otp_network_error', 'فشل الاتصال بالخادم'),
('ar', 'otp_invalid_response', 'استجابة غير صحيحة من الخادم'),
('ar', 'otp_already_used', 'تم استخدام هذا الرمز مسبقاً'),

-- English translations
('en', 'otp_invalid_or_expired', 'Invalid or expired verification code'),
('en', 'otp_verification_failed', 'Verification failed'),
('en', 'otp_network_error', 'Connection to server failed'),
('en', 'otp_invalid_response', 'Invalid response from server'),
('en', 'otp_already_used', 'This code has already been used')

ON CONFLICT (language_code, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();