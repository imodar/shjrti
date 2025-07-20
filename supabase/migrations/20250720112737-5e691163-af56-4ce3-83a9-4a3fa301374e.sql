-- Fix infinite recursion in family_members policies

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can insert family members for their families" ON public.family_members;

-- Create a security definer function to get user's families without recursion
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_uuid uuid)
RETURNS TABLE(family_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Get families where user is creator
  SELECT id as family_id FROM public.families WHERE creator_id = user_uuid
  UNION
  -- Get families where user is a member (using direct query without RLS)
  SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = user_uuid;
$$;

-- Create new INSERT policy using the security definer function
CREATE POLICY "Users can insert family members for their families" 
ON public.family_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  family_id IN (
    SELECT family_id FROM public.get_user_family_ids(auth.uid())
  )
);