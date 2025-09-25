-- Insert missing translation keys for family tree view
INSERT INTO translations (language_code, key, value, category) VALUES 
-- Arabic translations
('ar', 'familyTree', 'شجرة العائلة', 'family'),
('ar', 'familyTreeDescription', 'عرض تفاعلي وجميل لشجرة عائلتك', 'family'),
('ar', 'family', 'عائلة', 'general'),

-- English translations  
('en', 'familyTree', 'Family Tree', 'family'),
('en', 'familyTreeDescription', 'Interactive and beautiful view of your family tree', 'family'),
('en', 'family', 'Family', 'general')

ON CONFLICT (language_code, key) DO UPDATE SET
value = EXCLUDED.value,
updated_at = now();