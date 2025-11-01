-- Add missing Profile page translations
INSERT INTO translations (language_code, key, value, category) VALUES
-- English
('en', 'profile.calendar_type', 'Calendar Type', 'profile'),
('en', 'profile.choose_calendar', 'Choose calendar type', 'profile'),
('en', 'profile.gregorian_calendar', 'Gregorian Calendar (January, February...)', 'profile'),
('en', 'profile.levantine_calendar', 'Levantine Calendar (Kanun Thani, Shubat...)', 'profile'),
('en', 'profile.hijri_calendar', 'Hijri Calendar (Islamic)', 'profile'),
('en', 'profile.calendar_changed_gregorian', 'Calendar preference changed to Gregorian', 'profile'),
('en', 'profile.calendar_changed_levantine', 'Calendar preference changed to Levantine', 'profile'),
('en', 'profile.calendar_changed_hijri', 'Calendar preference changed to Hijri', 'profile'),
('en', 'profile.updated', 'Updated', 'profile'),
('en', 'profile.error', 'Error', 'profile'),
('en', 'profile.calendar_update_error', 'Error updating calendar preference', 'profile'),
('en', 'profile.click_to_switch', 'Click to switch', 'profile'),

-- Arabic
('ar', 'profile.calendar_type', 'نوع التقويم', 'profile'),
('ar', 'profile.choose_calendar', 'اختر نوع التقويم', 'profile'),
('ar', 'profile.gregorian_calendar', 'التقويم الميلادي (يناير، فبراير...)', 'profile'),
('ar', 'profile.levantine_calendar', 'التقويم الشامي (كانون الثاني، شباط...)', 'profile'),
('ar', 'profile.hijri_calendar', 'التقويم الهجري (الإسلامي)', 'profile'),
('ar', 'profile.calendar_changed_gregorian', 'تم تغيير تفضيل التقويم إلى الميلادي', 'profile'),
('ar', 'profile.calendar_changed_levantine', 'تم تغيير تفضيل التقويم إلى الشامي', 'profile'),
('ar', 'profile.calendar_changed_hijri', 'تم تغيير تفضيل التقويم إلى الهجري', 'profile'),
('ar', 'profile.updated', 'تم التحديث', 'profile'),
('ar', 'profile.error', 'خطأ', 'profile'),
('ar', 'profile.calendar_update_error', 'حدث خطأ أثناء تحديث تفضيل التقويم', 'profile'),
('ar', 'profile.click_to_switch', 'انقر للتبديل', 'profile')

ON CONFLICT (language_code, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();