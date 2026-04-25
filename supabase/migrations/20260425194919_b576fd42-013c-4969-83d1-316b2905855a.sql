INSERT INTO translations (key, language_code, value, category) VALUES
  ('common.unknown','ar','غير معروف','common'),
  ('common.unknown','en','Unknown','common'),
  ('profile.add_parents','ar','إضافة الوالدين','profile'),
  ('profile.add_parents','en','Add Parents','profile'),
  ('profile.add_parents_desc','ar','أضف والد ووالدة المؤسس لتوسيع شجرة العائلة','profile'),
  ('profile.add_parents_desc','en','Add the founder''s father and mother to extend the family tree','profile'),
  ('profile.admin_restricted','ar','هذا الإجراء مخصص للمسؤول فقط','profile'),
  ('profile.admin_restricted','en','This action is restricted to administrators only','profile'),
  ('profile.biography','ar','السيرة الذاتية','profile'),
  ('profile.biography','en','Biography','profile'),
  ('profile.family_statistics','ar','إحصائيات العائلة','profile'),
  ('profile.family_statistics','en','Family Statistics','profile'),
  ('profile.parent_management','ar','إدارة الوالدين','profile'),
  ('profile.parent_management','en','Parent Management','profile'),
  ('profile.present','ar','حتى الآن','profile'),
  ('profile.present','en','Present','profile')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;