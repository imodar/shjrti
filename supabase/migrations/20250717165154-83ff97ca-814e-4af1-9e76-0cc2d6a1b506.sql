-- Update all family tree members with null related_person_id to reference their family's founder
UPDATE family_tree_members 
SET related_person_id = (
  SELECT id 
  FROM family_tree_members founder 
  WHERE founder.family_id = family_tree_members.family_id 
    AND founder.is_founder = true 
  LIMIT 1
)
WHERE related_person_id IS NULL 
  AND NOT is_founder;