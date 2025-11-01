-- إضافة أعمدة جديدة لجدول family_memories
ALTER TABLE family_memories 
ADD COLUMN IF NOT EXISTS photo_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linked_member_id UUID REFERENCES family_tree_members(id) ON DELETE SET NULL;

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_family_memories_photo_date ON family_memories(photo_date);
CREATE INDEX IF NOT EXISTS idx_family_memories_linked_member ON family_memories(linked_member_id);

-- إنشاء فهرس GIN للبحث في التاجات
CREATE INDEX IF NOT EXISTS idx_family_memories_tags ON family_memories USING GIN(tags);