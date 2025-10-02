-- Create tree_edit_suggestions table
CREATE TABLE tree_edit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to family tree
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Optional reference to specific member being edited
  member_id UUID REFERENCES family_tree_members(id) ON DELETE CASCADE,
  
  -- Submitter information
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  is_email_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Suggestion content
  suggestion_type TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  suggested_changes JSONB,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected')),
  CONSTRAINT valid_suggestion_type CHECK (suggestion_type IN ('member_edit', 'new_member', 'member_delete', 'general'))
);

-- Create indexes for performance
CREATE INDEX idx_tree_edit_suggestions_family_id ON tree_edit_suggestions(family_id);
CREATE INDEX idx_tree_edit_suggestions_status ON tree_edit_suggestions(status);
CREATE INDEX idx_tree_edit_suggestions_email ON tree_edit_suggestions(submitter_email);
CREATE INDEX idx_tree_edit_suggestions_created_at ON tree_edit_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE tree_edit_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Tree owners can view suggestions for their trees
CREATE POLICY "Tree owners can view suggestions"
  ON tree_edit_suggestions FOR SELECT
  USING (
    family_id IN (
      SELECT id FROM families 
      WHERE creator_id = auth.uid()
    )
  );

-- 2. Tree owners can update suggestions for their trees
CREATE POLICY "Tree owners can update suggestions"
  ON tree_edit_suggestions FOR UPDATE
  USING (
    family_id IN (
      SELECT id FROM families 
      WHERE creator_id = auth.uid()
    )
  );

-- 3. Tree owners can delete suggestions for their trees
CREATE POLICY "Tree owners can delete suggestions"
  ON tree_edit_suggestions FOR DELETE
  USING (
    family_id IN (
      SELECT id FROM families 
      WHERE creator_id = auth.uid()
    )
  );

-- 4. Admins can do everything
CREATE POLICY "Admins can manage all suggestions"
  ON tree_edit_suggestions FOR ALL
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_tree_edit_suggestions_updated_at
  BEFORE UPDATE ON tree_edit_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();