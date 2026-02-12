INSERT INTO translations (key, language_code, value, category) VALUES
  ('profile.ascending_line', 'ar', 'خط صاعد', 'profile'),
  ('profile.ascending_line', 'en', 'Ascending Line', 'profile'),
  ('profile.add_child', 'ar', 'إضافة ابن/ابنة', 'profile'),
  ('profile.add_child', 'en', 'Add Child', 'profile'),
  ('profile.wife', 'ar', 'زوجة', 'profile'),
  ('profile.wife', 'en', 'Wife', 'profile'),
  ('profile.husband', 'ar', 'زوج', 'profile'),
  ('profile.husband', 'en', 'Husband', 'profile'),
  ('profile.spouse', 'ar', 'الشريك', 'profile'),
  ('profile.spouse', 'en', 'Spouse', 'profile')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;