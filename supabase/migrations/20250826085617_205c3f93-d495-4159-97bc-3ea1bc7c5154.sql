-- Fix security vulnerability: Restrict admin_users SELECT policy to only allow admins
-- Remove the overly permissive policy that allows anyone to read admin data
DROP POLICY IF EXISTS "Allow reading admin status" ON admin_users;

-- Create a secure policy that only allows admins to view admin user data
CREATE POLICY "Only admins can view admin users" 
ON admin_users 
FOR SELECT 
USING (is_admin(auth.uid()));