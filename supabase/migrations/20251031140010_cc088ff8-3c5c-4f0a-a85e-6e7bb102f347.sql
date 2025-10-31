-- Fix admin_users table - restrict SELECT to own record only
DROP POLICY IF EXISTS "Allow reading admin status" ON public.admin_users;

CREATE POLICY "Users can read their own admin status"
ON public.admin_users
FOR SELECT
USING (auth.uid() = user_id);

-- Add explicit denial for contact_submissions non-admin reads
CREATE POLICY "Non-admins cannot read contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));