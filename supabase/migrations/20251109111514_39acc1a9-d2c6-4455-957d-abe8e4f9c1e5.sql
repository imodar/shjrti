-- Add translation keys for member card birth/death information
INSERT INTO translations (language_code, key, value, category) VALUES
-- English translations
('en', 'member.born_male', 'Born', 'member'),
('en', 'member.born_female', 'Born', 'member'),
('en', 'member.died_male', 'Died', 'member'),
('en', 'member.died_female', 'Died', 'member'),
('en', 'member.in', 'in', 'member'),
('en', 'member.years', 'years', 'member'),

-- Arabic translations
('ar', 'member.born_male', 'ولد', 'member'),
('ar', 'member.born_female', 'ولدت', 'member'),
('ar', 'member.died_male', 'توفي', 'member'),
('ar', 'member.died_female', 'توفيت', 'member'),
('ar', 'member.in', 'في', 'member'),
('ar', 'member.years', 'سنة', 'member')
ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();