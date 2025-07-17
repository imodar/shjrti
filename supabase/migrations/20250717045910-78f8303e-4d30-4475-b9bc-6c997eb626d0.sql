-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on notifications" 
ON public.notifications 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.user_id = auth.uid())));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample notifications for existing users
INSERT INTO public.notifications (user_id, title, message, type, is_read) VALUES
((SELECT user_id FROM public.profiles WHERE email = 'mr.who@msn.com' LIMIT 1), 'مرحباً بك!', 'تم إنشاء حسابك بنجاح. ابدأ ببناء شجرة عائلتك الآن.', 'success', false),
((SELECT user_id FROM public.profiles WHERE email = 'mr.who@msn.com' LIMIT 1), 'نصيحة', 'أضف صوراً لأفراد العائلة لجعل الشجرة أكثر تفاعلاً.', 'info', false),
((SELECT user_id FROM public.profiles WHERE email = 'mr.who@msn.com' LIMIT 1), 'تحديث النظام', 'تم تحديث النظام بميزات جديدة. تحقق من التحديثات الجديدة.', 'info', true);