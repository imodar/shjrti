-- Allow public read access to family tree data for shared families
-- This enables public share links to work properly

-- Allow public read for families with share_gallery enabled
CREATE POLICY "Public read for shared families"
ON public.families
FOR SELECT
TO public
USING (share_gallery = true);

-- Allow public read for family members in shared families
CREATE POLICY "Public read for shared family members"
ON public.family_tree_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM families
    WHERE families.id = family_tree_members.family_id
    AND families.share_gallery = true
  )
);

-- Allow public read for marriages in shared families
CREATE POLICY "Public read for shared marriages"
ON public.marriages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM families
    WHERE families.id = marriages.family_id
    AND families.share_gallery = true
  )
);

-- Allow public read for member memories in shared families
CREATE POLICY "Public read for shared member memories"
ON public.member_memories
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM family_tree_members ftm
    JOIN families f ON f.id = ftm.family_id
    WHERE ftm.id = member_memories.member_id
    AND f.share_gallery = true
  )
);