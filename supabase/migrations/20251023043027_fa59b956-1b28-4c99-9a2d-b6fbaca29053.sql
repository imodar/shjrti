-- Security Fix: Protect visitor email addresses in tree_edit_suggestions table
-- Ensure RLS is enabled
ALTER TABLE tree_edit_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy to recreate with stricter rules
DROP POLICY IF EXISTS "Tree owners can view suggestions" ON tree_edit_suggestions;

-- Recreate SELECT policy with explicit protection for sensitive fields
-- Only tree owners and admins can view suggestion details including submitter info
CREATE POLICY "Tree owners can view suggestions"
ON tree_edit_suggestions
FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT id FROM families 
    WHERE creator_id = auth.uid()
  )
);

-- Add explicit policy to deny anonymous access
CREATE POLICY "Deny anonymous access to suggestions"
ON tree_edit_suggestions
FOR SELECT
TO anon
USING (false);

-- Ensure public insert is still allowed for suggestion submission
-- but limit what data can be inserted
DROP POLICY IF EXISTS "Allow public suggestion submission" ON tree_edit_suggestions;

CREATE POLICY "Allow public suggestion submission"
ON tree_edit_suggestions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Only allow inserting suggestions with required fields
  suggestion_type IS NOT NULL
  AND suggestion_text IS NOT NULL
  AND submitter_name IS NOT NULL
  AND submitter_email IS NOT NULL
  AND family_id IS NOT NULL
);