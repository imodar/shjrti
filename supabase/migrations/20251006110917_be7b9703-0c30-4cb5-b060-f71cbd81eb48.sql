-- Insert Profile page translations
-- English translations
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'profile.page_title', 'My Profile', 'profile'),
('en', 'profile.welcome_back', 'Welcome back', 'profile'),
('en', 'profile.account_statistics', 'Account Statistics', 'profile'),
('en', 'profile.families_created', 'Families Created', 'profile'),
('en', 'profile.total_members', 'Total Members', 'profile'),
('en', 'profile.personal_information', 'Personal Information', 'profile'),
('en', 'profile.first_name', 'First Name', 'profile'),
('en', 'profile.last_name', 'Last Name', 'profile'),
('en', 'profile.email', 'Email', 'profile'),
('en', 'profile.phone', 'Phone', 'profile'),
('en', 'profile.quick_actions', 'Quick Actions', 'profile'),
('en', 'profile.manage_subscription', 'Manage Subscription', 'profile'),
('en', 'profile.change_password', 'Change Password', 'profile'),
('en', 'profile.date_format', 'Date Format', 'profile'),
('en', 'profile.current_package', 'Current Package', 'profile'),
('en', 'profile.no_active_package', 'No Active Package', 'profile'),
('en', 'profile.expires', 'Expires', 'profile'),
('en', 'profile.edit', 'Edit', 'profile'),
('en', 'profile.save', 'Save', 'profile'),
('en', 'profile.cancel', 'Cancel', 'profile'),
('en', 'profile.profile_updated', 'Profile updated successfully', 'profile'),
('en', 'profile.profile_update_error', 'Error updating profile', 'profile')

ON CONFLICT (language_code, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Arabic translations
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'profile.page_title', 'ملفي الشخصي', 'profile'),
('ar', 'profile.welcome_back', 'مرحباً بعودتك', 'profile'),
('ar', 'profile.account_statistics', 'إحصائيات الحساب', 'profile'),
('ar', 'profile.families_created', 'العائلات المنشأة', 'profile'),
('ar', 'profile.total_members', 'إجمالي الأعضاء', 'profile'),
('ar', 'profile.personal_information', 'المعلومات الشخصية', 'profile'),
('ar', 'profile.first_name', 'الاسم الأول', 'profile'),
('ar', 'profile.last_name', 'اسم العائلة', 'profile'),
('ar', 'profile.email', 'البريد الإلكتروني', 'profile'),
('ar', 'profile.phone', 'رقم الهاتف', 'profile'),
('ar', 'profile.quick_actions', 'إجراءات سريعة', 'profile'),
('ar', 'profile.manage_subscription', 'إدارة الاشتراك', 'profile'),
('ar', 'profile.change_password', 'تغيير كلمة المرور', 'profile'),
('ar', 'profile.date_format', 'تنسيق التاريخ', 'profile'),
('ar', 'profile.current_package', 'الباقة الحالية', 'profile'),
('ar', 'profile.no_active_package', 'لا توجد باقة نشطة', 'profile'),
('ar', 'profile.expires', 'تنتهي في', 'profile'),
('ar', 'profile.edit', 'تعديل', 'profile'),
('ar', 'profile.save', 'حفظ', 'profile'),
('ar', 'profile.cancel', 'إلغاء', 'profile'),
('ar', 'profile.profile_updated', 'تم تحديث الملف الشخصي بنجاح', 'profile'),
('ar', 'profile.profile_update_error', 'خطأ في تحديث الملف الشخصي', 'profile')

ON CONFLICT (language_code, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();