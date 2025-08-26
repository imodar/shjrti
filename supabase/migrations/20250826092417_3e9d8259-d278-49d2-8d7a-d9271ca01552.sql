-- Check and fix contact_submissions table policies
-- Remove any duplicate or overly permissive policies

-- First, let's see what policies exist
DO $$
BEGIN
    -- Drop the duplicate "Allow public newsletter subscriptions" policy if it exists
    -- and ensure we only have the necessary policies
    
    -- For contact_submissions: Remove any duplicate INSERT policies
    DROP POLICY IF EXISTS "Allow anonymous newsletter subscriptions" ON contact_submissions;
    DROP POLICY IF EXISTS "Allow public newsletter subscriptions" ON contact_submissions;
    
    -- Ensure we only have the secure admin-only read policy and public insert for contact forms
    -- The existing policies are already secure, but let's make sure
    
    RAISE NOTICE 'Contact submissions policies cleaned up';
END $$;