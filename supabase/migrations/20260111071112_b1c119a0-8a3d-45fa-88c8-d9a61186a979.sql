-- Update add_founder_parent function to handle both father AND mother with marriage
CREATE OR REPLACE FUNCTION add_founder_parent(
  p_family_id UUID,
  p_parent_data JSONB,
  p_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_founder_id UUID;
  v_new_father_id UUID;
  v_new_mother_id UUID;
  v_family_creator_id UUID;
  v_current_founder_gender TEXT;
  -- Father data
  v_father_first_name TEXT;
  v_father_last_name TEXT;
  v_father_birth_date DATE;
  v_father_death_date DATE;
  v_father_is_alive BOOLEAN;
  -- Mother data
  v_mother_first_name TEXT;
  v_mother_last_name TEXT;
  v_mother_birth_date DATE;
  v_mother_death_date DATE;
  v_mother_is_alive BOOLEAN;
BEGIN
  -- 1. التحقق من أن المستخدم هو مالك العائلة
  SELECT creator_id INTO v_family_creator_id
  FROM families
  WHERE id = p_family_id;
  
  IF v_family_creator_id IS NULL THEN
    RAISE EXCEPTION 'Family not found';
  END IF;
  
  IF v_family_creator_id != p_user_id THEN
    RAISE EXCEPTION 'Only the family owner can add parents to the founder';
  END IF;
  
  -- 2. إيجاد المؤسس الحالي
  SELECT id, gender INTO v_current_founder_id, v_current_founder_gender
  FROM family_tree_members
  WHERE family_id = p_family_id AND is_founder = true
  LIMIT 1;
  
  IF v_current_founder_id IS NULL THEN
    RAISE EXCEPTION 'No founder found for this family';
  END IF;
  
  -- 3. استخراج بيانات الأب من JSON
  v_father_first_name := COALESCE(p_parent_data->'father'->>'first_name', 'غير معروف');
  v_father_last_name := p_parent_data->'father'->>'last_name';
  v_father_birth_date := (p_parent_data->'father'->>'birth_date')::DATE;
  v_father_death_date := (p_parent_data->'father'->>'death_date')::DATE;
  v_father_is_alive := COALESCE((p_parent_data->'father'->>'is_alive')::BOOLEAN, v_father_death_date IS NULL);
  
  -- 4. استخراج بيانات الأم من JSON
  v_mother_first_name := COALESCE(p_parent_data->'mother'->>'first_name', 'غير معروف');
  v_mother_last_name := p_parent_data->'mother'->>'last_name';
  v_mother_birth_date := (p_parent_data->'mother'->>'birth_date')::DATE;
  v_mother_death_date := (p_parent_data->'mother'->>'death_date')::DATE;
  v_mother_is_alive := COALESCE((p_parent_data->'mother'->>'is_alive')::BOOLEAN, v_mother_death_date IS NULL);
  
  -- 5. إنشاء عضو الأب كمؤسس جديد
  INSERT INTO family_tree_members (
    family_id,
    name,
    first_name,
    last_name,
    gender,
    birth_date,
    death_date,
    is_alive,
    is_founder,
    marital_status,
    created_by
  ) VALUES (
    p_family_id,
    v_father_first_name || COALESCE(' ' || v_father_last_name, ''),
    v_father_first_name,
    v_father_last_name,
    'male',
    v_father_birth_date,
    v_father_death_date,
    v_father_is_alive,
    true,  -- الأب هو المؤسس الجديد
    'married',
    p_user_id
  ) RETURNING id INTO v_new_father_id;
  
  -- 6. إنشاء عضو الأم كزوجة للمؤسس الجديد
  INSERT INTO family_tree_members (
    family_id,
    name,
    first_name,
    last_name,
    gender,
    birth_date,
    death_date,
    is_alive,
    is_founder,
    marital_status,
    spouse_id,
    created_by
  ) VALUES (
    p_family_id,
    v_mother_first_name || COALESCE(' ' || v_mother_last_name, ''),
    v_mother_first_name,
    v_mother_last_name,
    'female',
    v_mother_birth_date,
    v_mother_death_date,
    v_mother_is_alive,
    false,  -- الأم ليست المؤسس
    'married',
    v_new_father_id,  -- ربط الزوجة بالزوج
    p_user_id
  ) RETURNING id INTO v_new_mother_id;
  
  -- 7. تحديث الأب ليشير للأم كزوجة
  UPDATE family_tree_members
  SET spouse_id = v_new_mother_id
  WHERE id = v_new_father_id;
  
  -- 8. إنشاء سجل الزواج
  INSERT INTO marriages (
    family_id,
    husband_id,
    wife_id,
    is_active,
    marital_status
  ) VALUES (
    p_family_id,
    v_new_father_id,
    v_new_mother_id,
    true,
    'married'
  );
  
  -- 9. تحديث المؤسس القديم ليصبح ابن/ابنة للوالدين الجدد
  UPDATE family_tree_members
  SET 
    is_founder = false,
    father_id = v_new_father_id,
    mother_id = v_new_mother_id,
    updated_at = now()
  WHERE id = v_current_founder_id;
  
  -- 10. إرجاع ID الأب (المؤسس الجديد)
  RETURN v_new_father_id;
END;
$$;