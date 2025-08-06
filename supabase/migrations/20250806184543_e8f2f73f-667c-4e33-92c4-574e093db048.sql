-- إضافة جداول للبحث الذكي والاقتراحات
CREATE TABLE IF NOT EXISTS public.search_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('name', 'description', 'combined')),
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول الاقتراحات الذكية
CREATE TABLE IF NOT EXISTS public.smart_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('missing_info', 'relationship', 'name_variant', 'date_estimate')),
  suggestion_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.search_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_suggestions ENABLE ROW LEVEL SECURITY;

-- سياسات الحماية للـ embeddings
CREATE POLICY "Users can view embeddings for their family members" 
ON public.search_embeddings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.id = search_embeddings.family_member_id 
    AND fm.family_id IN (SELECT family_id FROM public.get_user_family_ids(auth.uid()))
  )
);

-- سياسات الحماية للاقتراحات
CREATE POLICY "Users can view their own suggestions" 
ON public.smart_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" 
ON public.smart_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggestions" 
ON public.smart_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_search_embeddings_family_member ON search_embeddings(family_member_id);
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_user_status ON smart_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_type ON smart_suggestions(suggestion_type);

-- إضافة trigger لتحديث updated_at
CREATE TRIGGER update_search_embeddings_updated_at
BEFORE UPDATE ON public.search_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_suggestions_updated_at
BEFORE UPDATE ON public.smart_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();