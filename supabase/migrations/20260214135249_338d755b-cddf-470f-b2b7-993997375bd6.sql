INSERT INTO translations (key, language_code, value, category) VALUES 
('nav.account_management', 'ar', 'إدارة الحساب', 'nav'),
('nav.account_management', 'en', 'Account Management', 'nav'),
('nav.account_management.desc', 'ar', 'إدارة الملف والإشتراكات والفوترة', 'nav'),
('nav.account_management.desc', 'en', 'Profile, subscriptions & billing', 'nav')
ON CONFLICT (key, language_code) DO NOTHING;