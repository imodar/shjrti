INSERT INTO translations (key, language_code, value, category) VALUES 
('stitch.in_days', 'ar', 'بعد', 'stitch'),
('stitch.in_days', 'en', 'In', 'stitch'),
('stitch.days', 'ar', 'يوم', 'stitch'),
('stitch.days', 'en', 'days', 'stitch')
ON CONFLICT (key, language_code) DO NOTHING;