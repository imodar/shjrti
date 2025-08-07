-- Clean up orphaned data and archived families
-- First, delete family_tree_members for archived families
DELETE FROM family_tree_members 
WHERE family_id IN (
  SELECT id FROM families WHERE is_archived = true
);

-- Delete marriages for archived families  
DELETE FROM marriages 
WHERE family_id IN (
  SELECT id FROM families WHERE is_archived = true
);

-- Delete the archived families themselves
DELETE FROM families WHERE is_archived = true;

-- Also clean up any orphaned family_tree_members without valid family_id
DELETE FROM family_tree_members 
WHERE family_id NOT IN (SELECT id FROM families);

-- Clean up any orphaned marriages without valid family_id
DELETE FROM marriages 
WHERE family_id NOT IN (SELECT id FROM families);