-- Remove subscription-related fields from families table and add archiving
-- These fields should not be in families as subscription is user-based, not tree-based

ALTER TABLE public.families 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_end_date;

-- Add archiving fields instead
ALTER TABLE public.families 
ADD COLUMN is_archived boolean DEFAULT false,
ADD COLUMN archived_at timestamp with time zone DEFAULT NULL;