-- Upsert missing English placeholders for name fields
INSERT INTO translations (language_code, key, value, category) VALUES
  ('en', 'enter_first_name', 'Enter your first name', 'auth'),
  ('en', 'enter_last_name', 'Enter your last name', 'auth')
ON CONFLICT (language_code, key)
DO UPDATE SET value = EXCLUDED.value, category = EXCLUDED.category, updated_at = now();