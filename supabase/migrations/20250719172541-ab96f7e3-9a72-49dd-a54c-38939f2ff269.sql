-- Drop the conflicting create_invoice function that causes ambiguity
DROP FUNCTION IF EXISTS public.create_invoice(p_user_id uuid, p_family_id uuid, p_package_id uuid, p_amount numeric, p_currency text);

-- Keep only the newer version that supports both user-based and family-based subscriptions
-- This function already exists and handles the optional family_id parameter correctly