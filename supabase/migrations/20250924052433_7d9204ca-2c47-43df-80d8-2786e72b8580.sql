-- Function to safely expose maintenance mode to all users regardless of RLS
CREATE OR REPLACE FUNCTION public.is_maintenance_mode_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((setting_value->>'enabled')::boolean, false)
  FROM public.admin_settings
  WHERE setting_key = 'maintenance_mode'
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

-- Allow both anonymous and authenticated clients to call the function
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode_enabled() TO anon, authenticated;