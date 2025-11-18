-- Add gender-aware translations for spouse relationships
INSERT INTO translations (key, language_code, value, category) VALUES
('common.with_his_wife', 'ar', 'مع زوجته', 'common'),
('common.with_his_wife', 'en', 'with his wife', 'common'),
('common.with_her_husband', 'ar', 'مع زوجها', 'common'),
('common.with_her_husband', 'en', 'with her husband', 'common')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;