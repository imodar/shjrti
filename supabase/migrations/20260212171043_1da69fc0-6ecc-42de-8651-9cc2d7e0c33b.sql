INSERT INTO translations (key, language_code, value, category) VALUES 
('stitch.about_family', 'ar', 'عن العائلة', 'stitch'),
('stitch.about_family', 'en', 'About the Family', 'stitch')
ON CONFLICT (key, language_code) DO NOTHING;