-- Add missing translation keys for remaining hardcoded text in FamilyBuilder

INSERT INTO translations (language_code, key, value, category) VALUES

-- Additional missing Arabic translations
('ar', 'family_builder.family_id_required', 'معرف العائلة مطلوب', 'family'),
('ar', 'family_builder.updated_successfully', 'تم التحديث بنجاح', 'family'),
('ar', 'family_builder.added_successfully', 'تم الإضافة بنجاح', 'family'),
('ar', 'family_builder.member_data_updated', 'تم تحديث بيانات', 'family'),
('ar', 'family_builder.member_added_to_family', 'تم إضافة', 'family'),
('ar', 'family_builder.error_adding_member', 'حدث خطأ أثناء إضافة الفرد', 'family'),
('ar', 'family_builder.unknown_error', 'خطأ غير معروف', 'family'),
('ar', 'family_builder.member_not_found', 'العضو غير موجود', 'family'),
('ar', 'family_builder.spouse_delete_warning_1', 'هذا الشخص زوج/زوجة لأحد أفراد العائلة.', 'family'),
('ar', 'family_builder.spouse_delete_warning_2', 'لحذف هذا الشخص، يجب تعديل بيانات الزوج/الزوجة وإزالة الزواج.', 'family'),
('ar', 'family_builder.related_member', 'العضو المرتبط', 'family'),
('ar', 'family_builder.marriage', 'زواج', 'family'),

-- Additional missing English translations
('en', 'family_builder.family_id_required', 'Family ID is required', 'family'),
('en', 'family_builder.updated_successfully', 'Updated successfully', 'family'),
('en', 'family_builder.added_successfully', 'Added successfully', 'family'),
('en', 'family_builder.member_data_updated', 'Member data updated', 'family'),
('en', 'family_builder.member_added_to_family', 'Added', 'family'),
('en', 'family_builder.error_adding_member', 'Error occurred while adding member', 'family'),
('en', 'family_builder.unknown_error', 'Unknown error', 'family'),
('en', 'family_builder.member_not_found', 'Member not found', 'family'),
('en', 'family_builder.spouse_delete_warning_1', 'This person is married to a family member.', 'family'),
('en', 'family_builder.spouse_delete_warning_2', 'To delete this person, you must edit the spouse data and remove the marriage.', 'family'),
('en', 'family_builder.related_member', 'Related member', 'family'),
('en', 'family_builder.marriage', 'marriage', 'family')

ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;