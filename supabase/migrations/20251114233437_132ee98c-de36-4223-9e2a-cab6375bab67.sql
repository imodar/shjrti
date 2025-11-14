-- Update email address in Privacy Policy page
UPDATE pages 
SET quick_info = jsonb_set(
  jsonb_set(
    quick_info::jsonb,
    '{contact_value,en}',
    '"support@shjrti.com"'
  ),
  '{contact_value,ar}',
  '"support@shjrti.com"'
)
WHERE slug = 'privacy-policy';