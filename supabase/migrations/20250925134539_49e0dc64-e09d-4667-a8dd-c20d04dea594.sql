-- Add member_memories feature flag to all packages
UPDATE packages SET 
  features = jsonb_set(
    features, 
    '{member_memories}', 
    'true'::jsonb
  )
WHERE name->>'en' IN ('Unlimited', 'Pro');

-- Add member_memories as false for Basic package
UPDATE packages SET 
  features = jsonb_set(
    features, 
    '{member_memories}', 
    'false'::jsonb
  )
WHERE name->>'en' = 'Basic';