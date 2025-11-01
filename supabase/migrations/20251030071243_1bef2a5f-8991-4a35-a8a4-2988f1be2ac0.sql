-- Add all TreeSettingsView translations (Part 1: Basic UI)
INSERT INTO translations (key, category, language_code, value) VALUES
('tree_settings.title', 'tree_settings', 'ar', 'إعدادات الشجرة'),
('tree_settings.title', 'tree_settings', 'en', 'Tree Settings'),
('tree_settings.back', 'tree_settings', 'ar', 'العودة'),
('tree_settings.back', 'tree_settings', 'en', 'Back'),
('tree_settings.family_of', 'tree_settings', 'ar', 'عائلة {name}'),
('tree_settings.family_of', 'tree_settings', 'en', 'Family {name}'),
('tree_settings.unknown', 'tree_settings', 'ar', 'غير محدد'),
('tree_settings.unknown', 'tree_settings', 'en', 'Unknown'),

-- Family Description
('tree_settings.family_description', 'tree_settings', 'ar', 'وصف العائلة'),
('tree_settings.family_description', 'tree_settings', 'en', 'Family Description'),
('tree_settings.description_subtitle', 'tree_settings', 'ar', 'أضف وصفاً مختصراً عن تاريخ عائلتك'),
('tree_settings.description_subtitle', 'tree_settings', 'en', 'Add a brief description about your family history'),
('tree_settings.description_placeholder', 'tree_settings', 'ar', 'أدخل وصف العائلة...'),
('tree_settings.description_placeholder', 'tree_settings', 'en', 'Enter family description...'),
('tree_settings.saving', 'tree_settings', 'ar', 'جاري الحفظ...'),
('tree_settings.saving', 'tree_settings', 'en', 'Saving...'),
('tree_settings.save', 'tree_settings', 'ar', 'حفظ'),
('tree_settings.save', 'tree_settings', 'en', 'Save'),
('tree_settings.cancel', 'tree_settings', 'ar', 'إلغاء'),
('tree_settings.cancel', 'tree_settings', 'en', 'Cancel'),
('tree_settings.no_description', 'tree_settings', 'ar', 'لم يتم إضافة وصف بعد...'),
('tree_settings.no_description', 'tree_settings', 'en', 'No description added yet...'),
('tree_settings.edit_description', 'tree_settings', 'ar', 'تعديل الوصف'),
('tree_settings.edit_description', 'tree_settings', 'en', 'Edit Description'),
('tree_settings.add_description', 'tree_settings', 'ar', 'إضافة وصف'),
('tree_settings.add_description', 'tree_settings', 'en', 'Add Description'),

-- Toast messages
('tree_settings.error', 'tree_settings', 'ar', 'خطأ'),
('tree_settings.error', 'tree_settings', 'en', 'Error'),
('tree_settings.save_failed', 'tree_settings', 'ar', 'فشل في حفظ وصف العائلة'),
('tree_settings.save_failed', 'tree_settings', 'en', 'Failed to save family description'),
('tree_settings.save_error', 'tree_settings', 'ar', 'حدث خطأ أثناء حفظ وصف العائلة'),
('tree_settings.save_error', 'tree_settings', 'en', 'An error occurred while saving family description'),
('tree_settings.saved', 'tree_settings', 'ar', 'تم الحفظ'),
('tree_settings.saved', 'tree_settings', 'en', 'Saved'),
('tree_settings.description_saved', 'tree_settings', 'ar', 'تم حفظ وصف العائلة بنجاح'),
('tree_settings.description_saved', 'tree_settings', 'en', 'Family description saved successfully')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();