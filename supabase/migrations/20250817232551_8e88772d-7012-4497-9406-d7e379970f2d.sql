-- إنشاء جدول لحفظ التغييرات المجدولة للباقات
CREATE TABLE public.scheduled_package_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_package_id UUID NOT NULL,
  target_package_id UUID NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.scheduled_package_changes ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات
CREATE POLICY "Users can view their own scheduled changes" 
ON public.scheduled_package_changes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled changes" 
ON public.scheduled_package_changes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled changes" 
ON public.scheduled_package_changes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled changes" 
ON public.scheduled_package_changes 
FOR DELETE 
USING (auth.uid() = user_id);

-- إضافة trigger للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_scheduled_package_changes_updated_at
BEFORE UPDATE ON public.scheduled_package_changes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();