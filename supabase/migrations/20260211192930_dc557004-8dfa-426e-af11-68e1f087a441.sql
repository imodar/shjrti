
INSERT INTO public.translations (key, language_code, value, category) VALUES
-- stitch keys
('stitch.family_of', 'ar', 'عائلة', 'stitch'), ('stitch.family_of', 'en', 'Family of', 'stitch'),
('stitch.last_updated', 'ar', 'آخر تحديث', 'stitch'), ('stitch.last_updated', 'en', 'Last updated', 'stitch'),

-- member keys
('member.add_wife_details', 'ar', 'معلومات الزوجة', 'member'), ('member.add_wife_details', 'en', 'Wife Information', 'member'),
('member.add_husband_details', 'ar', 'معلومات الزوج', 'member'), ('member.add_husband_details', 'en', 'Husband Information', 'member'),
('member.create_new', 'ar', 'إنشاء جديد', 'member'), ('member.create_new', 'en', 'Create New', 'member'),
('member.link_existing', 'ar', 'ربط عضو موجود', 'member'), ('member.link_existing', 'en', 'Link Existing Member', 'member'),
('member.select_member', 'ar', 'اختر العضو', 'member'), ('member.select_member', 'en', 'Select Member', 'member'),
('member.select_placeholder', 'ar', 'اختر عضو من العائلة...', 'member'), ('member.select_placeholder', 'en', 'Select a family member...', 'member'),
('member.marriage_status', 'ar', 'الحالة الزوجية', 'member'), ('member.marriage_status', 'en', 'Marriage Status', 'member'),
('member.married', 'ar', 'متزوج', 'member'), ('member.married', 'en', 'Married', 'member'),
('member.divorced', 'ar', 'مطلق', 'member'), ('member.divorced', 'en', 'Divorced', 'member'),
('member.widowed', 'ar', 'أرمل', 'member'), ('member.widowed', 'en', 'Widowed', 'member'),
('member.first_name', 'ar', 'الاسم الأول', 'member'), ('member.first_name', 'en', 'First Name', 'member'),
('member.first_name_placeholder', 'ar', 'الاسم الأول', 'member'), ('member.first_name_placeholder', 'en', 'First name', 'member'),
('member.last_name', 'ar', 'اسم العائلة', 'member'), ('member.last_name', 'en', 'Last Name', 'member'),
('member.last_name_placeholder', 'ar', 'اسم العائلة', 'member'), ('member.last_name_placeholder', 'en', 'Last name', 'member'),
('member.birth_date', 'ar', 'تاريخ الميلاد', 'member'), ('member.birth_date', 'en', 'Birth Date', 'member'),
('member.death_date', 'ar', 'تاريخ الوفاة', 'member'), ('member.death_date', 'en', 'Death Date', 'member'),
('member.biography', 'ar', 'السيرة الذاتية', 'member'), ('member.biography', 'en', 'Biography', 'member'),
('member.is_alive', 'ar', 'على قيد الحياة', 'member'), ('member.is_alive', 'en', 'Is Alive', 'member'),
('member.gender', 'ar', 'الجنس', 'member'), ('member.gender', 'en', 'Gender', 'member'),
('member.male', 'ar', 'ذكر', 'member'), ('member.male', 'en', 'Male', 'member'),
('member.female', 'ar', 'أنثى', 'member'), ('member.female', 'en', 'Female', 'member'),
('member.save', 'ar', 'حفظ', 'member'), ('member.save', 'en', 'Save', 'member'),
('member.cancel', 'ar', 'إلغاء', 'member'), ('member.cancel', 'en', 'Cancel', 'member'),

-- common keys
('common.search', 'ar', 'بحث...', 'common'), ('common.search', 'en', 'Search...', 'common'),
('common.save', 'ar', 'حفظ', 'common'), ('common.save', 'en', 'Save', 'common'),
('common.delete', 'ar', 'حذف', 'common'), ('common.delete', 'en', 'Delete', 'common'),
('common.cancel', 'ar', 'إلغاء', 'common'), ('common.cancel', 'en', 'Cancel', 'common'),
('common.confirm', 'ar', 'تأكيد', 'common'), ('common.confirm', 'en', 'Confirm', 'common'),

-- gallery keys
('gallery.title', 'ar', 'معرض الصور', 'gallery'), ('gallery.title', 'en', 'Photo Gallery', 'gallery'),
('gallery.upload', 'ar', 'رفع صورة', 'gallery'), ('gallery.upload', 'en', 'Upload Photo', 'gallery'),
('gallery.no_photos', 'ar', 'لا توجد صور بعد', 'gallery'), ('gallery.no_photos', 'en', 'No photos yet', 'gallery'),
('gallery.delete_confirm', 'ar', 'هل أنت متأكد من حذف هذه الصورة؟', 'gallery'), ('gallery.delete_confirm', 'en', 'Are you sure you want to delete this photo?', 'gallery'),

-- tree_view keys
('tree_view.all_branches', 'ar', 'جميع الفروع', 'tree_view'), ('tree_view.all_branches', 'en', 'All Branches', 'tree_view'),
('tree_view.select_root', 'ar', 'اختر الجذر', 'tree_view'), ('tree_view.select_root', 'en', 'Select Root', 'tree_view'),
('tree_view.search_branch', 'ar', 'البحث عن فرع...', 'tree_view'), ('tree_view.search_branch', 'en', 'Search branch...', 'tree_view'),
('tree_view.no_results', 'ar', 'لا توجد نتائج', 'tree_view'), ('tree_view.no_results', 'en', 'No results found', 'tree_view')

ON CONFLICT (key, language_code) DO NOTHING;
