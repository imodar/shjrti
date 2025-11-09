-- إضافة ترجمات MemberProfileView باللغة العربية
INSERT INTO translations (language_code, key, value, category) VALUES
-- رسائل النظام
('ar', 'profile.image_upload_failed', 'فشل تحميل الصورة', 'profile'),
('ar', 'profile.update_success', 'تم تحديث الملف الشخصي بنجاح', 'profile'),
('ar', 'profile.image_update_success', 'تم تحديث الصورة بنجاح', 'profile'),
('ar', 'profile.image_update_failed', 'فشل تحديث الصورة', 'profile'),

-- الأحداث والحالات (ذكر)
('ar', 'profile.was_born_male', 'وُلد', 'profile'),
('ar', 'profile.married_male', 'تزوج', 'profile'),
('ar', 'profile.died_male', 'توفي', 'profile'),
('ar', 'profile.divorced_male', 'طلّق', 'profile'),

-- الأحداث والحالات (أنثى)
('ar', 'profile.was_born_female', 'وُلدت', 'profile'),
('ar', 'profile.married_female', 'تزوجت', 'profile'),
('ar', 'profile.died_female', 'توفيت', 'profile'),
('ar', 'profile.divorced_female', 'طُلقت', 'profile'),

-- معلومات عامة
('ar', 'profile.date_unknown', 'التاريخ غير معروف', 'profile'),
('ar', 'profile.born_to_them', 'وُلد لهما', 'profile'),
('ar', 'profile.born_to_him', 'وُلد له', 'profile'),
('ar', 'profile.divorced', 'مطلق', 'profile'),
('ar', 'profile.married', 'متزوج', 'profile'),
('ar', 'profile.single', 'أعزب', 'profile'),

-- العلاقات
('ar', 'profile.son_of', 'ابن', 'profile'),
('ar', 'profile.daughter_of', 'ابنة', 'profile'),
('ar', 'profile.son_of_short', 'ابن', 'profile'),
('ar', 'profile.daughter_of_short', 'ابنة', 'profile'),
('ar', 'profile.husband_of', 'زوج', 'profile'),
('ar', 'profile.wife_of', 'زوجة', 'profile'),

-- الأجيال
('ar', 'profile.generation_1', 'الجيل الأول', 'profile'),
('ar', 'profile.generation_2', 'الجيل الثاني', 'profile'),
('ar', 'profile.generation_3', 'الجيل الثالث', 'profile'),
('ar', 'profile.generation_4', 'الجيل الرابع', 'profile'),
('ar', 'profile.generation_5', 'الجيل الخامس', 'profile'),
('ar', 'profile.generation_6', 'الجيل السادس', 'profile'),
('ar', 'profile.generation_7', 'الجيل السابع', 'profile'),
('ar', 'profile.generation_8', 'الجيل الثامن', 'profile'),
('ar', 'profile.generation_9', 'الجيل التاسع', 'profile'),
('ar', 'profile.generation_10', 'الجيل العاشر', 'profile'),
('ar', 'profile.generation', 'الجيل', 'profile'),

-- التبويبات
('ar', 'profile.tab_overview', 'نظرة عامة', 'profile'),
('ar', 'profile.tab_family', 'العائلة', 'profile'),
('ar', 'profile.tab_timeline', 'الأحداث', 'profile'),
('ar', 'profile.tab_media', 'الصور', 'profile'),

-- معلومات العضو
('ar', 'profile.deceased', 'متوفى', 'profile'),
('ar', 'profile.change_photo', 'تغيير الصورة', 'profile'),
('ar', 'profile.founder', 'المؤسس', 'profile'),
('ar', 'profile.years', 'سنة', 'profile'),
('ar', 'profile.spouses', 'الأزواج', 'profile'),
('ar', 'profile.children', 'الأبناء', 'profile'),
('ar', 'profile.grandchildren', 'الأحفاد', 'profile'),
('ar', 'profile.edit_info', 'تعديل المعلومات', 'profile'),
('ar', 'profile.suggest_edit', 'اقتراح تعديل', 'profile'),

-- المعلومات الشخصية
('ar', 'profile.personal_info', 'المعلومات الشخصية', 'profile'),
('ar', 'profile.basic_data', 'البيانات الأساسية', 'profile'),
('ar', 'profile.birth_date', 'تاريخ الميلاد', 'profile'),
('ar', 'profile.birth_place', 'مكان الميلاد', 'profile'),
('ar', 'profile.marital_status', 'الحالة الاجتماعية', 'profile'),
('ar', 'profile.gender', 'الجنس', 'profile'),
('ar', 'profile.male', 'ذكر', 'profile'),
('ar', 'profile.female', 'أنثى', 'profile'),
('ar', 'profile.death_date', 'تاريخ الوفاة', 'profile'),
('ar', 'profile.phone', 'رقم الهاتف', 'profile'),
('ar', 'profile.email', 'البريد الإلكتروني', 'profile'),

-- الوالدين
('ar', 'profile.parents', 'الوالدان', 'profile'),
('ar', 'profile.father', 'الأب', 'profile'),
('ar', 'profile.mother', 'الأم', 'profile'),

-- الزواج والأطفال
('ar', 'profile.not_married', 'غير متزوج', 'profile'),
('ar', 'profile.no_marriage_records', 'لا توجد سجلات زواج', 'profile'),
('ar', 'profile.spouses_and_children', 'الأزواج والأبناء', 'profile'),
('ar', 'profile.no_children_registered', 'لا يوجد أطفال مسجلين', 'profile'),
('ar', 'profile.other_children', 'أطفال آخرون', 'profile'),

-- الأحداث
('ar', 'profile.important_events', 'الأحداث المهمة', 'profile'),
('ar', 'profile.timeline_description', 'الأحداث الهامة في حياة هذا الشخص', 'profile'),
('ar', 'profile.event_birth', 'الميلاد', 'profile'),
('ar', 'profile.event_marriage', 'الزواج', 'profile'),
('ar', 'profile.event_divorce', 'الطلاق', 'profile'),
('ar', 'profile.event_childbirth', 'ولادة طفل', 'profile'),
('ar', 'profile.event_death', 'الوفاة', 'profile'),
('ar', 'profile.no_events', 'لا توجد أحداث مسجلة', 'profile'),
('ar', 'profile.events_will_appear', 'ستظهر الأحداث المهمة هنا', 'profile'),

-- إحصائيات العائلة
('ar', 'profile.family_stats', 'إحصائيات العائلة', 'profile'),

-- منطقة الخطر
('ar', 'profile.danger_zone', 'منطقة الخطر', 'profile'),
('ar', 'profile.delete_member', 'حذف العضو', 'profile'),
('ar', 'profile.cannot_undo', 'لا يمكن التراجع عن هذا الإجراء', 'profile'),
('ar', 'profile.update_profile_picture', 'تحديث الصورة الشخصية', 'profile'),

-- كلمات عامة
('ar', 'common.close', 'إغلاق', 'common'),
('ar', 'common.back', 'رجوع', 'common'),
('ar', 'common.not_specified', 'غير محدد', 'common'),
('ar', 'common.error', 'خطأ', 'common'),
('ar', 'common.from', 'من', 'common')

ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();

-- إضافة ترجمات MemberProfileView باللغة الإنجليزية
INSERT INTO translations (language_code, key, value, category) VALUES
-- System messages
('en', 'profile.image_upload_failed', 'Image upload failed', 'profile'),
('en', 'profile.update_success', 'Profile updated successfully', 'profile'),
('en', 'profile.image_update_success', 'Image updated successfully', 'profile'),
('en', 'profile.image_update_failed', 'Image update failed', 'profile'),

-- Events and statuses (male)
('en', 'profile.was_born_male', 'was born', 'profile'),
('en', 'profile.married_male', 'married', 'profile'),
('en', 'profile.died_male', 'died', 'profile'),
('en', 'profile.divorced_male', 'divorced', 'profile'),

-- Events and statuses (female)
('en', 'profile.was_born_female', 'was born', 'profile'),
('en', 'profile.married_female', 'married', 'profile'),
('en', 'profile.died_female', 'died', 'profile'),
('en', 'profile.divorced_female', 'divorced', 'profile'),

-- General information
('en', 'profile.date_unknown', 'Date unknown', 'profile'),
('en', 'profile.born_to_them', 'was born to them', 'profile'),
('en', 'profile.born_to_him', 'was born to him', 'profile'),
('en', 'profile.divorced', 'Divorced', 'profile'),
('en', 'profile.married', 'Married', 'profile'),
('en', 'profile.single', 'Single', 'profile'),

-- Relationships
('en', 'profile.son_of', 'Son of', 'profile'),
('en', 'profile.daughter_of', 'Daughter of', 'profile'),
('en', 'profile.son_of_short', 'Son of', 'profile'),
('en', 'profile.daughter_of_short', 'Daughter of', 'profile'),
('en', 'profile.husband_of', 'Husband of', 'profile'),
('en', 'profile.wife_of', 'Wife of', 'profile'),

-- Generations
('en', 'profile.generation_1', '1st Generation', 'profile'),
('en', 'profile.generation_2', '2nd Generation', 'profile'),
('en', 'profile.generation_3', '3rd Generation', 'profile'),
('en', 'profile.generation_4', '4th Generation', 'profile'),
('en', 'profile.generation_5', '5th Generation', 'profile'),
('en', 'profile.generation_6', '6th Generation', 'profile'),
('en', 'profile.generation_7', '7th Generation', 'profile'),
('en', 'profile.generation_8', '8th Generation', 'profile'),
('en', 'profile.generation_9', '9th Generation', 'profile'),
('en', 'profile.generation_10', '10th Generation', 'profile'),
('en', 'profile.generation', 'Generation', 'profile'),

-- Tabs
('en', 'profile.tab_overview', 'Overview', 'profile'),
('en', 'profile.tab_family', 'Family', 'profile'),
('en', 'profile.tab_timeline', 'Timeline', 'profile'),
('en', 'profile.tab_media', 'Media', 'profile'),

-- Member information
('en', 'profile.deceased', 'Deceased', 'profile'),
('en', 'profile.change_photo', 'Change Photo', 'profile'),
('en', 'profile.founder', 'Founder', 'profile'),
('en', 'profile.years', 'years', 'profile'),
('en', 'profile.spouses', 'Spouses', 'profile'),
('en', 'profile.children', 'Children', 'profile'),
('en', 'profile.grandchildren', 'Grandchildren', 'profile'),
('en', 'profile.edit_info', 'Edit Info', 'profile'),
('en', 'profile.suggest_edit', 'Suggest Edit', 'profile'),

-- Personal information
('en', 'profile.personal_info', 'Personal Information', 'profile'),
('en', 'profile.basic_data', 'Basic Data', 'profile'),
('en', 'profile.birth_date', 'Birth Date', 'profile'),
('en', 'profile.birth_place', 'Birth Place', 'profile'),
('en', 'profile.marital_status', 'Marital Status', 'profile'),
('en', 'profile.gender', 'Gender', 'profile'),
('en', 'profile.male', 'Male', 'profile'),
('en', 'profile.female', 'Female', 'profile'),
('en', 'profile.death_date', 'Death Date', 'profile'),
('en', 'profile.phone', 'Phone', 'profile'),
('en', 'profile.email', 'Email', 'profile'),

-- Parents
('en', 'profile.parents', 'Parents', 'profile'),
('en', 'profile.father', 'Father', 'profile'),
('en', 'profile.mother', 'Mother', 'profile'),

-- Marriage and children
('en', 'profile.not_married', 'Not Married', 'profile'),
('en', 'profile.no_marriage_records', 'No marriage records', 'profile'),
('en', 'profile.spouses_and_children', 'Spouses & Children', 'profile'),
('en', 'profile.no_children_registered', 'No children registered', 'profile'),
('en', 'profile.other_children', 'Other Children', 'profile'),

-- Events
('en', 'profile.important_events', 'Important Events', 'profile'),
('en', 'profile.timeline_description', 'Important events in this person life', 'profile'),
('en', 'profile.event_birth', 'Birth', 'profile'),
('en', 'profile.event_marriage', 'Marriage', 'profile'),
('en', 'profile.event_divorce', 'Divorce', 'profile'),
('en', 'profile.event_childbirth', 'Birth of child', 'profile'),
('en', 'profile.event_death', 'Death', 'profile'),
('en', 'profile.no_events', 'No events recorded', 'profile'),
('en', 'profile.events_will_appear', 'Important events will appear here', 'profile'),

-- Family statistics
('en', 'profile.family_stats', 'Family Statistics', 'profile'),

-- Danger zone
('en', 'profile.danger_zone', 'Danger Zone', 'profile'),
('en', 'profile.delete_member', 'Delete Member', 'profile'),
('en', 'profile.cannot_undo', 'This action cannot be undone', 'profile'),
('en', 'profile.update_profile_picture', 'Update Profile Picture', 'profile'),

-- Common words
('en', 'common.close', 'Close', 'common'),
('en', 'common.back', 'Back', 'common'),
('en', 'common.not_specified', 'Not specified', 'common'),
('en', 'common.error', 'Error', 'common'),
('en', 'common.from', 'from', 'common')

ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();