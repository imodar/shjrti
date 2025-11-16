-- إضافة عمود user_data لحفظ بيانات المستخدم المؤقتة في auth_otp_codes
ALTER TABLE public.auth_otp_codes 
ADD COLUMN IF NOT EXISTS user_data JSONB DEFAULT NULL;

-- إضافة تعليق للعمود
COMMENT ON COLUMN public.auth_otp_codes.user_data IS 'Temporary storage for user data during signup process (includes first_name, last_name, phone, password)';