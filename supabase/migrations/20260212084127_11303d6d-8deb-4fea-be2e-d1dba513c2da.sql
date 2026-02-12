
INSERT INTO translations (key, language_code, value, category) VALUES
('time.just_now', 'ar', 'الآن', 'time'),
('time.just_now', 'en', 'Just now', 'time'),
('time.ago', 'ar', 'منذ', 'time'),
('time.ago', 'en', 'ago', 'time'),
('time.minutes', 'ar', 'دقيقة', 'time'),
('time.minutes', 'en', 'minutes', 'time'),
('time.hours', 'ar', 'ساعة', 'time'),
('time.hours', 'en', 'hours', 'time'),
('time.days', 'ar', 'يوم', 'time'),
('time.days', 'en', 'days', 'time'),
('time.weeks', 'ar', 'أسبوع', 'time'),
('time.weeks', 'en', 'weeks', 'time'),
('time.months', 'ar', 'شهر', 'time'),
('time.months', 'en', 'months', 'time')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;
