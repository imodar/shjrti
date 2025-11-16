-- إضافة الترجمات المفقودة للـ Footer

-- العربية
INSERT INTO translations (key, value, language_code, category) VALUES
('footer_link_family_creator', 'إنشاء العائلة', 'ar', 'footer'),
('footer_link_store', 'المتجر', 'ar', 'footer'),
('footer_link_plans', 'خطط الاشتراك', 'ar', 'footer'),
('footer_link_profile', 'الملف الشخصي', 'ar', 'footer'),
('footer_newsletter_title', 'النشرة الإخبارية', 'ar', 'footer'),
('footer_newsletter_placeholder', 'بريدك الإلكتروني', 'ar', 'footer'),
('footer_newsletter_button', 'اشتراك', 'ar', 'footer')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- الإنجليزية
INSERT INTO translations (key, value, language_code, category) VALUES
('footer_link_family_creator', 'Create Family', 'en', 'footer'),
('footer_link_store', 'Store', 'en', 'footer'),
('footer_link_plans', 'Subscription Plans', 'en', 'footer'),
('footer_link_profile', 'Profile', 'en', 'footer'),
('footer_newsletter_title', 'Newsletter', 'en', 'footer'),
('footer_newsletter_placeholder', 'Your Email', 'en', 'footer'),
('footer_newsletter_button', 'Subscribe', 'en', 'footer')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;