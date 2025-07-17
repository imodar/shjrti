-- Fix the infinite recursion in admin_users RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can do everything on admin_users" ON public.admin_users;

-- Create a simpler policy that doesn't cause recursion
-- Allow users to read their own admin record
CREATE POLICY "Users can read their own admin record" 
ON public.admin_users 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow authenticated users to check if someone is an admin (needed for admin checks)
CREATE POLICY "Users can read admin status" 
ON public.admin_users 
FOR SELECT 
USING (true);

-- Only allow admins to insert/update/delete, but use a function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- Create policies using the function
CREATE POLICY "Admins can insert admin records" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update admin records" 
ON public.admin_users 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin records" 
ON public.admin_users 
FOR DELETE 
USING (public.is_admin(auth.uid()));