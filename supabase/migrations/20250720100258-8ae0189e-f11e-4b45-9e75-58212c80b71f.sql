-- Add INSERT policy for users to create their own families
CREATE POLICY "Users can create their own families" 
ON public.families 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = creator_id);