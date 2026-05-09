
-- 1. Fix activity_log INSERT policy (was open to public)
DROP POLICY IF EXISTS "Service role can insert activity logs" ON public.activity_log;

CREATE POLICY "Service role can insert activity logs"
  ON public.activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can log own activity"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Restrict email_templates SELECT to authenticated users only
DROP POLICY IF EXISTS "Everyone can read active email templates" ON public.email_templates;

CREATE POLICY "Authenticated users can read active email templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. Revert storage buckets to private + remove public read policies
UPDATE storage.buckets SET public = false
WHERE id IN ('family-memories', 'member-memories');

DROP POLICY IF EXISTS "Public read access to family memories bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to member memories bucket" ON storage.objects;
