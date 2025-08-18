-- Fix Function Search Path Security Issue
-- Update functions to set secure search_path
ALTER FUNCTION public.update_full_name() SET search_path = 'public';
ALTER FUNCTION public.get_user_family_ids(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_admin_secure(uuid) SET search_path = 'public';
ALTER FUNCTION public.delete_family_complete(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_user_status(uuid, user_status_type, text) SET search_path = 'public';
ALTER FUNCTION public.get_all_users_for_admin() SET search_path = 'public';
ALTER FUNCTION public.is_subscription_expired(uuid) SET search_path = 'public';
ALTER FUNCTION public.generate_invoice_number() SET search_path = 'public';
ALTER FUNCTION public.complete_payment_and_upgrade(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.create_invoice(uuid, uuid, numeric, text, uuid) SET search_path = 'public';
ALTER FUNCTION public.get_user_subscription_details(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.create_admin_user(text) SET search_path = 'public';
ALTER FUNCTION public.is_admin(uuid) SET search_path = 'public';