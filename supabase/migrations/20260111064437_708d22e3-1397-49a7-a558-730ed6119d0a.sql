-- ============================================
-- دالة إضافة والد/والدة للمؤسس
-- ============================================

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
  v_new_parent_id UUID;
  v_family_creator_id UUID;
  v_parent_type TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_birth_date DATE;
  v_death_date DATE;
  v_is_alive BOOLEAN;
  v_current_founder_gender TEXT;
BEGIN
  -- 1. التحقق من أن المستخدم هو مالك العائلة
  SELECT creator_id INTO v_family_creator_id
  FROM families
  WHERE id = p_family_id;
  
  IF v_family_creator_id IS NULL THEN
    RAISE EXCEPTION 'Family not found';
  END IF;
  
  IF v_family_creator_id != p_user_id THEN
    RAISE EXCEPTION 'Only the family owner can add a parent to the founder';
  END IF;
  
  -- 2. إيجاد المؤسس الحالي
  SELECT id, gender INTO v_current_founder_id, v_current_founder_gender
  FROM family_tree_members
  WHERE family_id = p_family_id AND is_founder = true
  LIMIT 1;
  
  IF v_current_founder_id IS NULL THEN
    RAISE EXCEPTION 'No founder found for this family';
  END IF;
  
  -- 3. استخراج بيانات الوالد الجديد من JSON
  v_parent_type := COALESCE(p_parent_data->>'parent_type', 'father');
  v_first_name := COALESCE(p_parent_data->>'first_name', 'غير معروف');
  v_last_name := p_parent_data->>'last_name';
  v_birth_date := (p_parent_data->>'birth_date')::DATE;
  v_death_date := (p_parent_data->>'death_date')::DATE;
  v_is_alive := COALESCE((p_parent_data->>'is_alive')::BOOLEAN, v_death_date IS NULL);
  
  -- 4. إنشاء العضو الجديد (الأب/الأم) كمؤسس جديد
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
    v_first_name || COALESCE(' ' || v_last_name, ''),
    v_first_name,
    v_last_name,
    CASE WHEN v_parent_type = 'father' THEN 'male' ELSE 'female' END,
    v_birth_date,
    v_death_date,
    v_is_alive,
    true,  -- المؤسس الجديد
    'married',
    p_user_id
  ) RETURNING id INTO v_new_parent_id;
  
  -- 5. تحديث المؤسس القديم ليصبح ابن/ابنة للمؤسس الجديد
  UPDATE family_tree_members
  SET 
    is_founder = false,
    father_id = CASE WHEN v_parent_type = 'father' THEN v_new_parent_id ELSE father_id END,
    mother_id = CASE WHEN v_parent_type = 'mother' THEN v_new_parent_id ELSE mother_id END,
    updated_at = now()
  WHERE id = v_current_founder_id;
  
  -- 6. إرجاع ID العضو الجديد
  RETURN v_new_parent_id;
END;
$$;

-- منح صلاحيات التنفيذ للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION add_founder_parent TO authenticated;

-- ============================================
-- إضافة الترجمات الجديدة
-- ============================================

INSERT INTO translations (key, language_code, value, category) VALUES
-- العربية
('founder.add_parent', 'ar', 'إضافة والد للمؤسس', 'founder'),
('founder.add_parent_warning_title', 'ar', 'تغيير مؤسس شجرة العائلة', 'founder'),
('founder.add_parent_warning_description', 'ar', 'أنت على وشك إضافة والد للمؤسس الحالي. هذا الإجراء سيغير هيكل الشجرة بالكامل.', 'founder'),
('founder.irreversible_action', 'ar', 'هذه العملية لا يمكن التراجع عنها!', 'founder'),
('founder.changes_summary', 'ar', 'التغييرات التي ستحدث', 'founder'),
('founder.new_founder_will_be', 'ar', 'سيصبح المؤسس الجديد', 'founder'),
('founder.current_founder_will_become', 'ar', 'سيصبح المؤسس الحالي', 'founder'),
('founder.son_of_new_founder', 'ar', 'ابن المؤسس الجديد', 'founder'),
('founder.daughter_of_new_founder', 'ar', 'ابنة المؤسس الجديد', 'founder'),
('founder.generations_reorder', 'ar', 'سيتم إعادة ترتيب جميع الأجيال في الشجرة', 'founder'),
('founder.confirm_understanding', 'ar', 'أفهم أن هذا الإجراء لا يمكن التراجع عنه', 'founder'),
('founder.type_family_name_confirm', 'ar', 'اكتب اسم العائلة للتأكيد', 'founder'),
('founder.confirm_change', 'ar', 'تأكيد التغيير', 'founder'),
('founder.step_warning', 'ar', 'تحذير', 'founder'),
('founder.step_data_entry', 'ar', 'إدخال البيانات', 'founder'),
('founder.step_confirmation', 'ar', 'التأكيد النهائي', 'founder'),
('founder.add_father', 'ar', 'إضافة أب', 'founder'),
('founder.add_mother', 'ar', 'إضافة أم', 'founder'),
('founder.parent_type', 'ar', 'نوع الوالد', 'founder'),
('founder.new_parent_name', 'ar', 'اسم الوالد الجديد', 'founder'),
('founder.add_parent_success', 'ar', 'تمت إضافة المؤسس الجديد بنجاح', 'founder'),
('founder.add_parent_error', 'ar', 'فشل في إضافة الوالد', 'founder'),
('founder.continue', 'ar', 'متابعة', 'founder'),
('founder.back', 'ar', 'رجوع', 'founder'),
('founder.cancel', 'ar', 'إلغاء', 'founder'),
('founder.current_founder', 'ar', 'المؤسس الحالي', 'founder'),
('founder.new_founder_preview', 'ar', 'معاينة المؤسس الجديد', 'founder'),
-- English
('founder.add_parent', 'en', 'Add Parent to Founder', 'founder'),
('founder.add_parent_warning_title', 'en', 'Change Family Tree Founder', 'founder'),
('founder.add_parent_warning_description', 'en', 'You are about to add a parent to the current founder. This action will change the entire tree structure.', 'founder'),
('founder.irreversible_action', 'en', 'This action cannot be undone!', 'founder'),
('founder.changes_summary', 'en', 'Changes that will occur', 'founder'),
('founder.new_founder_will_be', 'en', 'Will become the new founder', 'founder'),
('founder.current_founder_will_become', 'en', 'Current founder will become', 'founder'),
('founder.son_of_new_founder', 'en', 'Son of the new founder', 'founder'),
('founder.daughter_of_new_founder', 'en', 'Daughter of the new founder', 'founder'),
('founder.generations_reorder', 'en', 'All generations in the tree will be reordered', 'founder'),
('founder.confirm_understanding', 'en', 'I understand that this action cannot be undone', 'founder'),
('founder.type_family_name_confirm', 'en', 'Type the family name to confirm', 'founder'),
('founder.confirm_change', 'en', 'Confirm Change', 'founder'),
('founder.step_warning', 'en', 'Warning', 'founder'),
('founder.step_data_entry', 'en', 'Data Entry', 'founder'),
('founder.step_confirmation', 'en', 'Final Confirmation', 'founder'),
('founder.add_father', 'en', 'Add Father', 'founder'),
('founder.add_mother', 'en', 'Add Mother', 'founder'),
('founder.parent_type', 'en', 'Parent Type', 'founder'),
('founder.new_parent_name', 'en', 'New Parent Name', 'founder'),
('founder.add_parent_success', 'en', 'New founder added successfully', 'founder'),
('founder.add_parent_error', 'en', 'Failed to add parent', 'founder'),
('founder.continue', 'en', 'Continue', 'founder'),
('founder.back', 'en', 'Back', 'founder'),
('founder.cancel', 'en', 'Cancel', 'founder'),
('founder.current_founder', 'en', 'Current Founder', 'founder'),
('founder.new_founder_preview', 'en', 'New Founder Preview', 'founder')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value, updated_at = now();