-- Add missing INSERT policies for family-related tables

-- Add INSERT policy for family_members
CREATE POLICY "Users can insert family members for their families" 
ON public.family_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Add INSERT policy for family_tree_members (it already has other policies but missing INSERT)
CREATE POLICY "Users can insert family tree members for their families" 
ON public.family_tree_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Add INSERT policy for marriages (it already has other policies but missing INSERT)
CREATE POLICY "Users can insert marriages for their families" 
ON public.marriages 
FOR INSERT 
TO authenticated
WITH CHECK (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);