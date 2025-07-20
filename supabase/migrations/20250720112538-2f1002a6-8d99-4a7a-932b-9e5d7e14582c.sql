-- Add UPDATE policy for families table to allow users to update their own families
CREATE POLICY "Users can update their own families" 
ON public.families 
FOR UPDATE 
TO authenticated
USING (auth.uid() = creator_id OR EXISTS (
  SELECT 1 FROM public.family_members 
  WHERE family_members.family_id = families.id 
  AND family_members.user_id = auth.uid()
));