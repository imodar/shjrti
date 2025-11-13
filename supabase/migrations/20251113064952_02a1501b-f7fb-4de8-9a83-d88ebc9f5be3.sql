-- Insert email templates for OTP authentication
-- These templates will be used by send-otp edge function

-- Template for signup OTP
INSERT INTO public.email_templates (template_key, template_name, subject, body, variables, description, is_active)
VALUES (
  'signup_otp',
  '{"ar": "رمز التحقق للتسجيل", "en": "Signup Verification Code"}'::jsonb,
  '{"ar": "رمز التحقق لإنشاء حسابك", "en": "Your Verification Code"}'::jsonb,
  '{"ar": "<div style=\"direction: rtl; text-align: right; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;\"><h2 style=\"color: #2563eb;\">مرحباً {{first_name}}!</h2><p>شكراً لتسجيلك في موقعنا. استخدم الرمز التالي لتأكيد بريدك الإلكتروني:</p><div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; margin: 20px 0; border-radius: 8px;\">{{otp_code}}</div><p style=\"color: #6b7280;\">هذا الرمز صالح لمدة 10 دقائق فقط.</p><p style=\"color: #6b7280;\">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.</p></div>", "en": "<div style=\"font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;\"><h2 style=\"color: #2563eb;\">Welcome {{first_name}}!</h2><p>Thank you for signing up. Please use the following code to verify your email:</p><div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; margin: 20px 0; border-radius: 8px;\">{{otp_code}}</div><p style=\"color: #6b7280;\">This code is valid for 10 minutes only.</p><p style=\"color: #6b7280;\">If you didn''t request this code, you can safely ignore this message.</p></div>"}'::jsonb,
  ARRAY['otp_code', 'first_name', 'last_name', 'email'],
  'OTP template for user signup verification',
  true
) ON CONFLICT (template_key) DO UPDATE
SET template_name = EXCLUDED.template_name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Template for login OTP
INSERT INTO public.email_templates (template_key, template_name, subject, body, variables, description, is_active)
VALUES (
  'login_otp',
  '{"ar": "رمز تسجيل الدخول", "en": "Login Verification Code"}'::jsonb,
  '{"ar": "رمز التحقق لتسجيل الدخول", "en": "Your Login Code"}'::jsonb,
  '{"ar": "<div style=\"direction: rtl; text-align: right; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;\"><h2 style=\"color: #2563eb;\">رمز تسجيل الدخول</h2><p>استخدم الرمز التالي لتسجيل الدخول إلى حسابك:</p><div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; margin: 20px 0; border-radius: 8px;\">{{otp_code}}</div><p style=\"color: #6b7280;\">هذا الرمز صالح لمدة 10 دقائق فقط.</p><p style=\"color: #ef4444;\">إذا لم تحاول تسجيل الدخول، يرجى تجاهل هذه الرسالة وتأمين حسابك.</p></div>", "en": "<div style=\"font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;\"><h2 style=\"color: #2563eb;\">Login Verification</h2><p>Use the following code to log in to your account:</p><div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; margin: 20px 0; border-radius: 8px;\">{{otp_code}}</div><p style=\"color: #6b7280;\">This code is valid for 10 minutes only.</p><p style=\"color: #ef4444;\">If you didn''t attempt to log in, please ignore this message and secure your account.</p></div>"}'::jsonb,
  ARRAY['otp_code', 'email'],
  'OTP template for user login',
  true
) ON CONFLICT (template_key) DO UPDATE
SET template_name = EXCLUDED.template_name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Template for password reset OTP
INSERT INTO public.email_templates (template_key, template_name, subject, body, variables, description, is_active)
VALUES (
  'reset_password_otp',
  '{"ar": "رمز إعادة تعيين كلمة المرور", "en": "Password Reset Code"}'::jsonb,
  '{"ar": "رمز التحقق لإعادة تعيين كلمة المرور", "en": "Reset Your Password"}'::jsonb,
  '{"ar": "<div style=\"direction: rtl; text-align: right; font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;\"><h2 style=\"color: #2563eb;\">إعادة تعيين كلمة المرور</h2><p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك. استخدم الرمز التالي لإعادة التعيين:</p><div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; margin: 20px 0; border-radius: 8px;\">{{otp_code}}</div><p style=\"color: #6b7280;\">هذا الرمز صالح لمدة 10 دقائق فقط.</p><p style=\"color: #ef4444;\">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة وتأمين حسابك فوراً.</p></div>", "en": "<div style=\"font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;\"><h2 style=\"color: #2563eb;\">Reset Your Password</h2><p>We received a request to reset your password. Use the following code to proceed:</p><div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1f2937; margin: 20px 0; border-radius: 8px;\">{{otp_code}}</div><p style=\"color: #6b7280;\">This code is valid for 10 minutes only.</p><p style=\"color: #ef4444;\">If you didn''t request a password reset, please ignore this message and secure your account immediately.</p></div>"}'::jsonb,
  ARRAY['otp_code', 'email'],
  'OTP template for password reset',
  true
) ON CONFLICT (template_key) DO UPDATE
SET template_name = EXCLUDED.template_name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    description = EXCLUDED.description,
    updated_at = NOW();