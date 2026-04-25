INSERT INTO translations (key, language_code, value, category) VALUES
  ('profile.mother_unknown_title','ar','الأم غير مسجلة','profile'),
  ('profile.mother_unknown_title','en','Mother Not Registered','profile'),
  ('profile.mother_unknown_desc','ar','لم يتم تسجيل بيانات الأم بعد. يمكنك تحديث المعلومات لاحقاً من الملف الشخصي.','profile'),
  ('profile.mother_unknown_desc','en','The mother''s information has not been added yet. You can update it later from the profile.','profile'),
  ('profile.spouse_of','ar','زوجة','profile'),
  ('profile.spouse_of','en','Wife of','profile')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;