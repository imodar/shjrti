-- Add cookie consent translations to the translations table
-- Category: cookies

-- Arabic translations
INSERT INTO public.translations (language_code, key, value, category) VALUES
('ar', 'cookie_banner_title', 'نحن نستخدم ملفات تعريف الارتباط (Cookies)', 'cookies'),
('ar', 'cookie_banner_description', 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا، وتحليل حركة المرور، وتخصيص المحتوى. يمكنك اختيار أنواع الملفات التي توافق على استخدامها.', 'cookies'),
('ar', 'cookie_accept_all', 'قبول الكل', 'cookies'),
('ar', 'cookie_reject_all', 'رفض الكل', 'cookies'),
('ar', 'cookie_customize', 'تخصيص الإعدادات', 'cookies'),
('ar', 'cookie_save_preferences', 'حفظ التفضيلات', 'cookies'),
('ar', 'cookie_cancel', 'إلغاء', 'cookies'),
('ar', 'cookie_settings_title', 'إعدادات ملفات تعريف الارتباط', 'cookies'),
('ar', 'cookie_settings_description', 'يمكنك التحكم في أنواع ملفات تعريف الارتباط التي نستخدمها. الملفات الضرورية مطلوبة دائماً لتشغيل الموقع بشكل صحيح.', 'cookies'),
('ar', 'cookie_necessary_title', 'ملفات ضرورية', 'cookies'),
('ar', 'cookie_necessary_description', 'هذه الملفات ضرورية لتشغيل الموقع بشكل صحيح ولا يمكن تعطيلها. تشمل إدارة الجلسات والأمان وإمكانية الوصول.', 'cookies'),
('ar', 'cookie_analytics_title', 'ملفات التحليلات', 'cookies'),
('ar', 'cookie_analytics_description', 'تساعدنا هذه الملفات على فهم كيفية تفاعل الزوار مع موقعنا من خلال جمع معلومات مجهولة المصدر. تستخدم لتحسين أداء الموقع وتجربة المستخدم.', 'cookies'),
('ar', 'cookie_marketing_title', 'ملفات التسويق', 'cookies'),
('ar', 'cookie_marketing_description', 'تستخدم هذه الملفات لتتبع الزوار عبر المواقع وعرض إعلانات مخصصة وذات صلة. قد تشارك هذه المعلومات مع شركاء الإعلانات.', 'cookies'),
('ar', 'cookie_preferences_title', 'ملفات التفضيلات', 'cookies'),
('ar', 'cookie_preferences_description', 'تسمح هذه الملفات للموقع بتذكر اختياراتك مثل اللغة والمنطقة وتفضيلات العرض لتوفير تجربة محسّنة وشخصية.', 'cookies'),
('ar', 'cookie_always_active', 'مفعّل دائماً', 'cookies'),
('ar', 'cookie_settings_link', 'إعدادات الكوكيز', 'cookies'),
('ar', 'cookie_preferences_saved', 'تم حفظ تفضيلات الكوكيز بنجاح', 'cookies'),
('ar', 'cookie_preferences_error', 'حدث خطأ أثناء حفظ التفضيلات', 'cookies');

-- English translations
INSERT INTO public.translations (language_code, key, value, category) VALUES
('en', 'cookie_banner_title', 'We Use Cookies', 'cookies'),
('en', 'cookie_banner_description', 'We use cookies to enhance your experience on our website, analyze traffic, and personalize content. You can choose which types of cookies you consent to use.', 'cookies'),
('en', 'cookie_accept_all', 'Accept All', 'cookies'),
('en', 'cookie_reject_all', 'Reject All', 'cookies'),
('en', 'cookie_customize', 'Customize Settings', 'cookies'),
('en', 'cookie_save_preferences', 'Save Preferences', 'cookies'),
('en', 'cookie_cancel', 'Cancel', 'cookies'),
('en', 'cookie_settings_title', 'Cookie Settings', 'cookies'),
('en', 'cookie_settings_description', 'You can control which types of cookies we use. Necessary cookies are always required for the website to function properly.', 'cookies'),
('en', 'cookie_necessary_title', 'Necessary Cookies', 'cookies'),
('en', 'cookie_necessary_description', 'These cookies are essential for the website to function properly and cannot be disabled. They include session management, security, and accessibility features.', 'cookies'),
('en', 'cookie_analytics_title', 'Analytics Cookies', 'cookies'),
('en', 'cookie_analytics_description', 'These cookies help us understand how visitors interact with our website by collecting anonymous information. Used to improve website performance and user experience.', 'cookies'),
('en', 'cookie_marketing_title', 'Marketing Cookies', 'cookies'),
('en', 'cookie_marketing_description', 'These cookies are used to track visitors across websites and display personalized and relevant ads. This information may be shared with advertising partners.', 'cookies'),
('en', 'cookie_preferences_title', 'Preference Cookies', 'cookies'),
('en', 'cookie_preferences_description', 'These cookies allow the website to remember your choices such as language, region, and display preferences to provide an enhanced and personalized experience.', 'cookies'),
('en', 'cookie_always_active', 'Always Active', 'cookies'),
('en', 'cookie_settings_link', 'Cookie Settings', 'cookies'),
('en', 'cookie_preferences_saved', 'Cookie preferences saved successfully', 'cookies'),
('en', 'cookie_preferences_error', 'An error occurred while saving preferences', 'cookies');

-- Create user_cookie_preferences table
CREATE TABLE IF NOT EXISTS public.user_cookie_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  necessary BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  preferences BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_cookie_preferences_user_id ON public.user_cookie_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_cookie_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cookie preferences"
  ON public.user_cookie_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookie preferences"
  ON public.user_cookie_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cookie preferences"
  ON public.user_cookie_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cookie preferences"
  ON public.user_cookie_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create trigger to update updated_at
CREATE TRIGGER update_user_cookie_preferences_updated_at
  BEFORE UPDATE ON public.user_cookie_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.user_cookie_preferences IS 'Stores user cookie consent preferences for GDPR compliance';