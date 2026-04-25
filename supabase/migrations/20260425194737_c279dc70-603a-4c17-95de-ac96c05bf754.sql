INSERT INTO translations (key, language_code, value, category) VALUES
  ('profile.not_added','ar','غير مسجل','profile'),
  ('profile.not_added','en','Not added','profile'),
  ('profile.alive','ar','على قيد الحياة','profile'),
  ('profile.alive','en','Alive','profile'),
  ('common.male','ar','ذكر','common'),
  ('common.male','en','Male','common'),
  ('common.female','ar','أنثى','common'),
  ('common.female','en','Female','common')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;