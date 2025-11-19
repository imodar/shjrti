-- ==========================================
-- Share Tokens Security System Migration
-- ==========================================

-- Step 1: Add share token columns to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours');

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_families_share_token ON public.families(share_token);
CREATE INDEX IF NOT EXISTS idx_families_share_token_expires_at ON public.families(share_token_expires_at);

-- Step 2: Drop ALL existing RLS policies to start fresh
-- Families table
DROP POLICY IF EXISTS "Allow public read access to families for sharing" ON public.families;
DROP POLICY IF EXISTS "Users can read their own families" ON public.families;
DROP POLICY IF EXISTS "Users can update their own families" ON public.families;
DROP POLICY IF EXISTS "Users can create their own families" ON public.families;
DROP POLICY IF EXISTS "Admins can do everything on families" ON public.families;

-- Family tree members
DROP POLICY IF EXISTS "Allow public read access to family tree members for sharing" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can read their family members" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can view family tree members of their families" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can insert family tree members for their families" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can update family tree members of their families" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can delete family tree members of their families" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can create family tree members for their families" ON public.family_tree_members;
DROP POLICY IF EXISTS "Users can manage their family members" ON public.family_tree_members;
DROP POLICY IF EXISTS "Admins can manage all family tree members" ON public.family_tree_members;

-- Marriages
DROP POLICY IF EXISTS "Allow public read access to marriages for sharing" ON public.marriages;
DROP POLICY IF EXISTS "Users can read their family marriages" ON public.marriages;
DROP POLICY IF EXISTS "Users can view marriages of their families" ON public.marriages;
DROP POLICY IF EXISTS "Users can insert marriages for their families" ON public.marriages;
DROP POLICY IF EXISTS "Users can create marriages for their families" ON public.marriages;
DROP POLICY IF EXISTS "Users can update marriages of their families" ON public.marriages;
DROP POLICY IF EXISTS "Users can delete marriages of their families" ON public.marriages;
DROP POLICY IF EXISTS "Users can manage their family marriages" ON public.marriages;
DROP POLICY IF EXISTS "Admins can manage all marriages" ON public.marriages;

-- Step 3: Create new protected RLS policies
-- Families table
CREATE POLICY "Owners and admins can read families"
ON public.families FOR SELECT
USING (auth.uid() = creator_id OR is_admin(auth.uid()));

CREATE POLICY "Owners and admins can update families"
ON public.families FOR UPDATE
USING (auth.uid() = creator_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create families"
ON public.families FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can delete families"
ON public.families FOR DELETE
USING (is_admin(auth.uid()));

-- Family tree members
CREATE POLICY "Owners and admins can read family members"
ON public.family_tree_members FOR SELECT
USING (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Owners and admins can insert family members"
ON public.family_tree_members FOR INSERT
WITH CHECK (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Owners and admins can update family members"
ON public.family_tree_members FOR UPDATE
USING (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Owners and admins can delete family members"
ON public.family_tree_members FOR DELETE
USING (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Marriages
CREATE POLICY "Owners and admins can read marriages"
ON public.marriages FOR SELECT
USING (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Owners and admins can insert marriages"
ON public.marriages FOR INSERT
WITH CHECK (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Owners and admins can update marriages"
ON public.marriages FOR UPDATE
USING (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Owners and admins can delete marriages"
ON public.marriages FOR DELETE
USING (
  family_id IN (SELECT id FROM families WHERE creator_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Step 4: Create function to regenerate share token
CREATE OR REPLACE FUNCTION public.regenerate_share_token(
  p_family_id UUID,
  p_expires_in_hours INTEGER DEFAULT 2
)
RETURNS TABLE (
  share_token UUID,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token UUID;
  v_expires_at TIMESTAMPTZ;
  v_family_creator UUID;
BEGIN
  SELECT creator_id INTO v_family_creator
  FROM families WHERE id = p_family_id;

  IF NOT (auth.uid() = v_family_creator OR is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied: Only family owner or admin can regenerate share token';
  END IF;

  v_new_token := gen_random_uuid();
  v_expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;

  UPDATE families
  SET share_token = v_new_token, share_token_expires_at = v_expires_at, updated_at = NOW()
  WHERE id = p_family_id;

  RETURN QUERY SELECT v_new_token, v_expires_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_share_token(UUID, INTEGER) TO authenticated;

-- Step 5: Initialize tokens for existing families
UPDATE public.families
SET share_token = gen_random_uuid(), share_token_expires_at = NOW() + INTERVAL '2 hours'
WHERE share_token IS NULL;