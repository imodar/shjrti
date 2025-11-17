-- Add translations for males and females labels
INSERT INTO translations (key, language_code, value, category) VALUES
('profile.males', 'ar', 'الذكور', 'profile'),
('profile.males', 'en', 'Males', 'profile'),
('profile.females', 'ar', 'الإناث', 'profile'),
('profile.females', 'en', 'Females', 'profile')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();