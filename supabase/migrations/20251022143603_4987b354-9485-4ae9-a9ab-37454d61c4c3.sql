-- Add indexes for better query performance on family_tree_members
CREATE INDEX IF NOT EXISTS idx_family_tree_members_family_id 
ON family_tree_members(family_id);

CREATE INDEX IF NOT EXISTS idx_family_tree_members_father_id 
ON family_tree_members(father_id) WHERE father_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_family_tree_members_mother_id 
ON family_tree_members(mother_id) WHERE mother_id IS NOT NULL;

-- Composite index for common queries (family + gender)
CREATE INDEX IF NOT EXISTS idx_family_tree_members_family_gender 
ON family_tree_members(family_id, gender);

-- Add indexes for marriages table
CREATE INDEX IF NOT EXISTS idx_marriages_family_id 
ON marriages(family_id);

CREATE INDEX IF NOT EXISTS idx_marriages_husband_id 
ON marriages(husband_id);

CREATE INDEX IF NOT EXISTS idx_marriages_wife_id 
ON marriages(wife_id);

-- Add index for member_memories
CREATE INDEX IF NOT EXISTS idx_member_memories_member_id 
ON member_memories(member_id);

-- Add index for family_memories
CREATE INDEX IF NOT EXISTS idx_family_memories_family_id 
ON family_memories(family_id);

-- Analyze tables to update statistics for query planner
ANALYZE family_tree_members;
ANALYZE marriages;
ANALYZE member_memories;
ANALYZE family_memories;