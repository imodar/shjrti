INSERT INTO translations (key, language_code, value, category) VALUES
  ('profile.the_husband', 'ar', 'الزوج', 'profile'),
  ('profile.the_husband', 'en', 'Husband', 'profile'),
  ('profile.the_wife', 'ar', 'الزوجة', 'profile'),
  ('profile.the_wife', 'en', 'Wife', 'profile')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;