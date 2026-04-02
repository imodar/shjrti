INSERT INTO translations (key, language_code, value, category) VALUES
('member.wife_info_available', 'ar', 'اسم الزوجة ومعلوماتها متوفرة', 'member'),
('member.wife_info_available', 'en', 'Wife name and info available', 'member')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;