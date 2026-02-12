INSERT INTO translations (key, language_code, value, category) VALUES
  ('profile.grandson', 'ar', 'حفيد', 'profile'),
  ('profile.grandson', 'en', 'Grandson', 'profile'),
  ('profile.granddaughter', 'ar', 'حفيدة', 'profile'),
  ('profile.granddaughter', 'en', 'Granddaughter', 'profile')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;