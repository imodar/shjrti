-- Insert missing translations for Dashboard page

-- Arabic translations
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'confirm_deletion', 'تأكيد الحذف', 'dashboard'),
('ar', 'serious_warning', 'تحذير خطير', 'dashboard'),
('ar', 'irreversible_action', 'هذا الإجراء', 'dashboard'),
('ar', 'cannot_be_undone', 'لا يمكن التراجع عنه', 'dashboard'),
('ar', 'cancel', 'إلغاء', 'dashboard'),
('ar', 'final_delete', 'حذف نهائي', 'dashboard'),
('ar', 'family_word', 'عائلة', 'dashboard'),
('ar', 'member_count', 'فرد', 'dashboard'),
('ar', 'members_count', 'أفراد', 'dashboard'),
('ar', 'created_on_prefix', 'تم الإنشاء في', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;

-- English translations  
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'confirm_deletion', 'Confirm Deletion', 'dashboard'),
('en', 'serious_warning', 'Serious Warning', 'dashboard'),
('en', 'irreversible_action', 'This action', 'dashboard'),
('en', 'cannot_be_undone', 'cannot be undone', 'dashboard'),
('en', 'cancel', 'Cancel', 'dashboard'),
('en', 'final_delete', 'Delete Permanently', 'dashboard'),
('en', 'family_word', 'Family', 'dashboard'),
('en', 'member_count', 'member', 'dashboard'),
('en', 'members_count', 'members', 'dashboard'),
('en', 'created_on_prefix', 'Created on', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;