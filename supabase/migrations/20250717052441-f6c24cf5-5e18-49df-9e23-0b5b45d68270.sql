-- Fix the infinite recursion in admin_users RLS policy
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Admins can do everything on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin records" ON public.admin_users;

-- Create a security definer function to check admin status without recursion
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

-- Create simple policies that don't cause recursion
-- Allow everyone to read admin_users table (needed for admin checks)
CREATE POLICY "Allow reading admin status" 
ON public.admin_users 
FOR SELECT 
USING (true);

-- Allow only existing admins to modify admin records
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