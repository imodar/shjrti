-- إضافة جدول الزيجات لربط الأزواج والزوجات
CREATE TABLE public.marriages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  husband_id UUID REFERENCES public.family_tree_members(id) ON DELETE CASCADE NOT NULL,
  wife_id UUID REFERENCES public.family_tree_members(id) ON DELETE CASCADE NOT NULL,
  marriage_date DATE,
  divorce_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(husband_id, wife_id)
);

-- تحديث جدول family_tree_members لإضافة معلومات الوالدين
ALTER TABLE public.family_tree_members 
DROP COLUMN IF EXISTS relation,
ADD COLUMN father_id UUID REFERENCES public.family_tree_members(id) ON DELETE SET NULL,
ADD COLUMN mother_id UUID REFERENCES public.family_tree_members(id) ON DELETE SET NULL,
ADD COLUMN is_founder BOOLEAN DEFAULT false;

-- إضافة فهارس للأداء
CREATE INDEX idx_marriages_family_id ON public.marriages(family_id);
CREATE INDEX idx_marriages_husband_id ON public.marriages(husband_id);
CREATE INDEX idx_marriages_wife_id ON public.marriages(wife_id);
CREATE INDEX idx_family_tree_members_father_id ON public.family_tree_members(father_id);
CREATE INDEX idx_family_tree_members_mother_id ON public.family_tree_members(mother_id);

-- تفعيل RLS للجدول الجديد
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للزيجات
CREATE POLICY "Users can view marriages of their families" 
ON public.marriages 
FOR SELECT 
USING (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create marriages for their families" 
ON public.marriages 
FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update marriages of their families" 
ON public.marriages 
FOR UPDATE 
USING (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete marriages of their families" 
ON public.marriages 
FOR DELETE 
USING (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- الإدارة يمكنها إدارة كل الزيجات
CREATE POLICY "Admins can manage all marriages" 
ON public.marriages 
FOR ALL 
USING (is_admin(auth.uid()));

-- إضافة trigger للتحديث التلقائي للوقت
CREATE TRIGGER update_marriages_updated_at
BEFORE UPDATE ON public.marriages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();