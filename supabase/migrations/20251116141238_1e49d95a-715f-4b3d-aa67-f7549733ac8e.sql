-- إضافة حقول التوائم إلى جدول family_tree_members
ALTER TABLE family_tree_members 
ADD COLUMN IF NOT EXISTS is_twin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS twin_group_id UUID;

-- إضافة فهرس لتحسين الأداء عند البحث عن التوائم
CREATE INDEX IF NOT EXISTS idx_twin_group_id ON family_tree_members(twin_group_id);

-- إضافة constraint للتأكد من أن twin_group_id يشير إلى عضو في نفس الجدول
-- نستخدم DO block لإضافة constraint بشكل آمن فقط إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_twin_group'
  ) THEN
    ALTER TABLE family_tree_members
    ADD CONSTRAINT fk_twin_group 
    FOREIGN KEY (twin_group_id) 
    REFERENCES family_tree_members(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- تعليق توضيحي
COMMENT ON COLUMN family_tree_members.is_twin IS 'Indicates if this member is a twin';
COMMENT ON COLUMN family_tree_members.twin_group_id IS 'Groups twins together - all twins share the same twin_group_id';