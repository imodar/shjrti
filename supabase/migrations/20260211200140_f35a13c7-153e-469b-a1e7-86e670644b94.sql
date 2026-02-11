INSERT INTO public.translations (key, language_code, value, category) VALUES
('dashboard.upgrade_plan', 'ar', 'ترقية باقتك', 'dashboard'),
('dashboard.upgrade_plan', 'en', 'Upgrade Your Plan', 'dashboard'),
('dashboard.upgrade_description', 'ar', 'احصل على مزايا أكثر وأشجار غير محدودة', 'dashboard'),
('dashboard.upgrade_description', 'en', 'Get more features and unlimited trees', 'dashboard'),
('dashboard.upgrade_now', 'ar', 'ترقية الآن', 'dashboard'),
('dashboard.upgrade_now', 'en', 'Upgrade Now', 'dashboard')
ON CONFLICT (key, language_code) DO NOTHING;