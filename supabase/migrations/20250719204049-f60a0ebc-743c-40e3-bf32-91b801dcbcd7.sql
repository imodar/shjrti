-- Check and ensure the newsletter subscription policy allows anonymous users
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;

-- Create a policy that explicitly allows both anonymous and authenticated users to insert
CREATE POLICY "Enable insert for newsletter subscriptions"
ON public.newsletter_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);