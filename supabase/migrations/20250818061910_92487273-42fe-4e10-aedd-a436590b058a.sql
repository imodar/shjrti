-- Add unique constraint on user_id to scheduled_package_changes table
-- This ensures only one scheduled change per user
ALTER TABLE public.scheduled_package_changes 
ADD CONSTRAINT scheduled_package_changes_user_id_unique UNIQUE (user_id);