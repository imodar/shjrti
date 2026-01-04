-- Create RPC function to get comprehensive user statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_admin_user_statistics()
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz,
  last_login timestamptz,
  total_trees bigint,
  total_members bigint,
  total_member_photos bigint,
  total_family_photos bigint,
  subscription_status text,
  subscription_package_name jsonb,
  trees_detail jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_trees AS (
    SELECT 
      f.creator_id,
      f.id as family_id,
      f.name as tree_name,
      f.created_at as tree_created_at,
      COALESCE((
        SELECT COUNT(*) FROM family_tree_members ftm 
        WHERE ftm.family_id = f.id
      ), 0) as members_count,
      COALESCE((
        SELECT COUNT(*) FROM family_memories fm 
        WHERE fm.family_id = f.id
      ), 0) as tree_photos_count,
      COALESCE((
        SELECT COUNT(*) FROM member_memories mm
        JOIN family_tree_members ftm ON mm.member_id = ftm.id
        WHERE ftm.family_id = f.id
      ), 0) as members_photos_count
    FROM families f
    WHERE f.is_archived IS NOT TRUE
  ),
  user_aggregated AS (
    SELECT 
      ut.creator_id,
      COUNT(DISTINCT ut.family_id) as total_trees,
      SUM(ut.members_count) as total_members,
      SUM(ut.members_photos_count) as total_member_photos,
      SUM(ut.tree_photos_count) as total_family_photos,
      jsonb_agg(
        jsonb_build_object(
          'family_id', ut.family_id,
          'tree_name', ut.tree_name,
          'tree_created_at', ut.tree_created_at,
          'members_count', ut.members_count,
          'tree_photos_count', ut.tree_photos_count,
          'members_photos_count', ut.members_photos_count
        ) ORDER BY ut.tree_created_at DESC
      ) FILTER (WHERE ut.family_id IS NOT NULL) as trees_detail
    FROM user_trees ut
    GROUP BY ut.creator_id
  ),
  user_last_login AS (
    SELECT 
      la.email,
      MAX(la.attempted_at) as last_login
    FROM login_attempts la
    WHERE la.success = true
    GROUP BY la.email
  ),
  user_subscription AS (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      us.status as subscription_status,
      p.name as subscription_package_name
    FROM user_subscriptions us
    LEFT JOIN packages p ON us.package_id = p.id
    WHERE us.status = 'active'
    ORDER BY us.user_id, us.created_at DESC
  )
  SELECT 
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.created_at,
    ull.last_login,
    COALESCE(ua.total_trees, 0)::bigint,
    COALESCE(ua.total_members, 0)::bigint,
    COALESCE(ua.total_member_photos, 0)::bigint,
    COALESCE(ua.total_family_photos, 0)::bigint,
    COALESCE(usub.subscription_status, 'none'),
    usub.subscription_package_name,
    COALESCE(ua.trees_detail, '[]'::jsonb)
  FROM profiles p
  LEFT JOIN user_aggregated ua ON ua.creator_id = p.user_id
  LEFT JOIN user_last_login ull ON ull.email = p.email
  LEFT JOIN user_subscription usub ON usub.user_id = p.user_id
  ORDER BY COALESCE(ua.total_trees, 0) DESC, COALESCE(ua.total_members, 0) DESC, p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (admin check is done in application layer)
GRANT EXECUTE ON FUNCTION get_admin_user_statistics() TO authenticated;