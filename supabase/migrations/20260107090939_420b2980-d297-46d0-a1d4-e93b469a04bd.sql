-- Insert translations for the FamilySuggestions page
-- Arabic translations
INSERT INTO public.translations (key, language_code, value, category)
VALUES 
  ('suggestions.page_title', 'ar', 'اقتراحات التعديل', 'suggestions'),
  ('suggestions.page_description', 'ar', 'إدارة ومراجعة اقتراحات التعديل المقدمة من الزوار', 'suggestions'),
  ('suggestions.stats.total', 'ar', 'إجمالي الاقتراحات', 'suggestions'),
  ('suggestions.stats.pending', 'ar', 'قيد الانتظار', 'suggestions'),
  ('suggestions.stats.accepted', 'ar', 'مقبولة', 'suggestions'),
  ('suggestions.stats.rejected', 'ar', 'مرفوضة', 'suggestions'),
  ('suggestions.search_placeholder', 'ar', 'البحث في الاقتراحات...', 'suggestions'),
  ('suggestions.filter_by_status', 'ar', 'فلتر حسب الحالة', 'suggestions'),
  ('suggestions.status.all', 'ar', 'جميع الاقتراحات', 'suggestions'),
  ('suggestions.status.pending', 'ar', 'قيد الانتظار', 'suggestions'),
  ('suggestions.status.under_review', 'ar', 'قيد المراجعة', 'suggestions'),
  ('suggestions.status.accepted', 'ar', 'مقبول', 'suggestions'),
  ('suggestions.status.rejected', 'ar', 'مرفوض', 'suggestions'),
  ('suggestions.no_suggestions_found', 'ar', 'لا توجد اقتراحات', 'suggestions'),
  ('suggestions.submitter_name', 'ar', 'الاسم', 'suggestions'),
  ('suggestions.submitter_email', 'ar', 'البريد', 'suggestions'),
  ('suggestions.suggestion_content', 'ar', 'محتوى الاقتراح', 'suggestions'),
  ('suggestions.notes', 'ar', 'ملاحظات المدير', 'suggestions'),
  ('suggestions.accept', 'ar', 'قبول', 'suggestions'),
  ('suggestions.reject', 'ar', 'رفض', 'suggestions'),
  ('suggestions.accept_title', 'ar', 'قبول الاقتراح', 'suggestions'),
  ('suggestions.reject_title', 'ar', 'رفض الاقتراح', 'suggestions'),
  ('suggestions.accept_desc', 'ar', 'هل أنت متأكد من قبول هذا الاقتراح؟', 'suggestions'),
  ('suggestions.reject_desc', 'ar', 'هل أنت متأكد من رفض هذا الاقتراح؟', 'suggestions'),
  ('suggestions.add_notes_placeholder', 'ar', 'أضف ملاحظاتك هنا (اختياري)...', 'suggestions'),
  ('suggestions.cancel', 'ar', 'إلغاء', 'suggestions'),
  ('suggestions.confirm', 'ar', 'تأكيد', 'suggestions')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- English translations
INSERT INTO public.translations (key, language_code, value, category)
VALUES 
  ('suggestions.page_title', 'en', 'Edit Suggestions', 'suggestions'),
  ('suggestions.page_description', 'en', 'Manage and review edit suggestions from visitors', 'suggestions'),
  ('suggestions.stats.total', 'en', 'Total Suggestions', 'suggestions'),
  ('suggestions.stats.pending', 'en', 'Pending', 'suggestions'),
  ('suggestions.stats.accepted', 'en', 'Accepted', 'suggestions'),
  ('suggestions.stats.rejected', 'en', 'Rejected', 'suggestions'),
  ('suggestions.search_placeholder', 'en', 'Search suggestions...', 'suggestions'),
  ('suggestions.filter_by_status', 'en', 'Filter by status', 'suggestions'),
  ('suggestions.status.all', 'en', 'All Suggestions', 'suggestions'),
  ('suggestions.status.pending', 'en', 'Pending', 'suggestions'),
  ('suggestions.status.under_review', 'en', 'Under Review', 'suggestions'),
  ('suggestions.status.accepted', 'en', 'Accepted', 'suggestions'),
  ('suggestions.status.rejected', 'en', 'Rejected', 'suggestions'),
  ('suggestions.no_suggestions_found', 'en', 'No suggestions found', 'suggestions'),
  ('suggestions.submitter_name', 'en', 'Name', 'suggestions'),
  ('suggestions.submitter_email', 'en', 'Email', 'suggestions'),
  ('suggestions.suggestion_content', 'en', 'Suggestion Content', 'suggestions'),
  ('suggestions.notes', 'en', 'Admin Notes', 'suggestions'),
  ('suggestions.accept', 'en', 'Accept', 'suggestions'),
  ('suggestions.reject', 'en', 'Reject', 'suggestions'),
  ('suggestions.accept_title', 'en', 'Accept Suggestion', 'suggestions'),
  ('suggestions.reject_title', 'en', 'Reject Suggestion', 'suggestions'),
  ('suggestions.accept_desc', 'en', 'Are you sure you want to accept this suggestion?', 'suggestions'),
  ('suggestions.reject_desc', 'en', 'Are you sure you want to reject this suggestion?', 'suggestions'),
  ('suggestions.add_notes_placeholder', 'en', 'Add your notes here (optional)...', 'suggestions'),
  ('suggestions.cancel', 'en', 'Cancel', 'suggestions'),
  ('suggestions.confirm', 'en', 'Confirm', 'suggestions')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value, updated_at = now();