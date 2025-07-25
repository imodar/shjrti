-- Create function to get all users including unconfirmed ones
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  phone text,
  created_at timestamptz,
  updated_at timestamptz,
  profile_id uuid,
  first_name text,
  last_name text,
  profile_phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.phone,
    au.created_at,
    au.updated_at,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.phone as profile_phone
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  ORDER BY au.created_at DESC;
$$;