INSERT INTO translations (key, language_code, value, category) VALUES
('settings.back_to_members', 'ar', 'العودة الى إدارة الأعضاء', 'settings'),
('settings.back_to_members', 'en', 'Back to Members Management', 'settings')
ON CONFLICT (key, language_code) DO NOTHING;