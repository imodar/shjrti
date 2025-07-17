-- Add spouse_id column to family_tree_members table
ALTER TABLE family_tree_members 
ADD COLUMN spouse_id UUID REFERENCES family_tree_members(id);

-- Create index for better performance
CREATE INDEX idx_family_tree_members_spouse_id ON family_tree_members(spouse_id);

-- Update existing records to set spouse_id based on marriages table
-- For husbands, set spouse_id to wife_id
UPDATE family_tree_members 
SET spouse_id = (
  SELECT wife_id 
  FROM marriages 
  WHERE husband_id = family_tree_members.id 
    AND is_active = true 
  LIMIT 1
)
WHERE id IN (SELECT husband_id FROM marriages WHERE is_active = true);

-- For wives, set spouse_id to husband_id  
UPDATE family_tree_members 
SET spouse_id = (
  SELECT husband_id 
  FROM marriages 
  WHERE wife_id = family_tree_members.id 
    AND is_active = true 
  LIMIT 1
)
WHERE id IN (SELECT wife_id FROM marriages WHERE is_active = true);