
-- Drop and recreate the function to include profile images count
DROP FUNCTION IF EXISTS get_admin_user_statistics();

CREATE OR REPLACE FUNCTION get_admin_user_statistics()
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz,
  last_login timestamptz,
  subscription_status text,
  subscription_package_name jsonb,
  total_trees bigint,
  total_members bigint,
  total_member_photos bigint,
  total_family_photos bigint,
  trees_detail jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.created_at,
    (SELECT MAX(la.attempted_at) FROM login_attempts la WHERE la.email = p.email AND la.success = true) as last_login,
    COALESCE(us.status, 'none') as subscription_status,
    COALESCE(pkg.name, '{"en": "No Package", "ar": "بدون باقة"}'::jsonb) as subscription_package_name,
    (SELECT COUNT(*) FROM families f WHERE f.creator_id = p.user_id) as total_trees,
    (SELECT COUNT(*) FROM family_tree_members ftm 
     JOIN families f ON ftm.family_id = f.id 
     WHERE f.creator_id = p.user_id) as total_members,
    -- Count profile images (image_url in family_tree_members) + member_memories
    (SELECT COUNT(*) FROM family_tree_members ftm
     JOIN families f ON ftm.family_id = f.id
     WHERE f.creator_id = p.user_id AND ftm.image_url IS NOT NULL AND ftm.image_url != '') +
    (SELECT COUNT(*) FROM member_memories mm
     JOIN family_tree_members ftm ON mm.member_id = ftm.id
     JOIN families f ON ftm.family_id = f.id
     WHERE f.creator_id = p.user_id) as total_member_photos,
    -- Count family gallery photos
    (SELECT COUNT(*) FROM family_memories fm
     JOIN families f ON fm.family_id = f.id
     WHERE f.creator_id = p.user_id) as total_family_photos,
    -- Trees detail with correct photo counts
    (SELECT jsonb_agg(jsonb_build_object(
      'id', fam.id,
      'name', fam.name,
      'members_count', (SELECT COUNT(*) FROM family_tree_members ftm WHERE ftm.family_id = fam.id),
      'member_photos', 
        (SELECT COUNT(*) FROM family_tree_members ftm WHERE ftm.family_id = fam.id AND ftm.image_url IS NOT NULL AND ftm.image_url != '') +
        (SELECT COUNT(*) FROM member_memories mm JOIN family_tree_members ftm ON mm.member_id = ftm.id WHERE ftm.family_id = fam.id),
      'family_photos', (SELECT COUNT(*) FROM family_memories fm WHERE fm.family_id = fam.id)
    ))
    FROM families fam WHERE fam.creator_id = p.user_id) as trees_detail
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.user_id AND us.status = 'active'
  LEFT JOIN packages pkg ON pkg.id = us.package_id
  ORDER BY (SELECT COUNT(*) FROM families f WHERE f.creator_id = p.user_id) DESC,
           (SELECT COUNT(*) FROM family_tree_members ftm JOIN families f ON ftm.family_id = f.id WHERE f.creator_id = p.user_id) DESC;
END;
$$;
