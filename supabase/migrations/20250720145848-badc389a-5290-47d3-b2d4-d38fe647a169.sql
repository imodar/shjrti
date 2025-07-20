-- Add missing dashboard translation keys
INSERT INTO translations (key, value, language_code, category) VALUES
('dashboard_have', 'You have', 'en', 'dashboard'),
('dashboard_have', 'لديك', 'ar', 'dashboard'),
('dashboard_single_tree', 'one tree', 'en', 'dashboard'),
('dashboard_single_tree', 'شجرة واحدة', 'ar', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  updated_at = now();