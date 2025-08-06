-- Create pages table for managing static pages content with multilingual support
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  meta_description JSONB DEFAULT '{}',
  meta_keywords JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policies for pages
CREATE POLICY "Everyone can read active pages" 
ON public.pages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all pages" 
ON public.pages 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pages
INSERT INTO public.pages (slug, title, content, meta_description, is_active, display_order) VALUES 
(
  'terms-conditions',
  '{"en": "Terms and Conditions", "ar": "الشروط والأحكام"}',
  '{"en": "<h2>1. Acceptance of Terms</h2><p>By accessing and using the Family Tree platform, you agree to be bound by these terms and conditions and all applicable laws and regulations.</p><p>If you do not agree with any of these terms, please do not use the platform.</p><h2>2. Service Definition</h2><p>The Family Tree platform is a digital service that allows users to create and manage their family trees, save information, photos, and family history.</p><p>The service includes creating profiles for family members, linking family relationships, and exporting data.</p>", "ar": "<h2>1. قبول الشروط</h2><p>بالوصول إلى منصة أشجار العائلة واستخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها.</p><p>إذا كنت لا توافق على أي من هذه الشروط، فيُرجى عدم استخدام المنصة.</p><h2>2. تعريف الخدمة</h2><p>منصة أشجار العائلة هي خدمة رقمية تتيح للمستخدمين إنشاء وإدارة أشجار عائلاتهم، وحفظ المعلومات والصور والتاريخ العائلي.</p><p>تشمل الخدمة إنشاء ملفات شخصية لأفراد العائلة، وربط العلاقات الأسرية، وتصدير البيانات.</p>"}',
  '{"en": "Terms and conditions for using the Family Tree platform", "ar": "شروط وأحكام استخدام منصة أشجار العائلة"}',
  true,
  1
),
(
  'privacy-policy',
  '{"en": "Privacy Policy", "ar": "سياسة الخصوصية"}',
  '{"en": "<h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p><h2>2. How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p><h2>3. Information Sharing</h2><p>We do not sell, trade, or otherwise transfer your personal information to third parties without your explicit consent, except as described in this policy.</p>", "ar": "<h2>1. المعلومات التي نجمعها</h2><p>نحن نجمع المعلومات التي تقدمها لنا مباشرة، مثل عندما تنشئ حساباً أو تستخدم خدماتنا أو تتصل بنا للحصول على الدعم.</p><h2>2. كيف نستخدم معلوماتك</h2><p>نستخدم المعلومات التي نجمعها لتوفير خدماتنا والحفاظ عليها وتحسينها، ومعالجة المعاملات، والتواصل معك.</p><h2>3. مشاركة المعلومات</h2><p>نحن لا نبيع أو نتاجر أو ننقل معلوماتك الشخصية إلى أطراف ثالثة دون موافقتك الصريحة، باستثناء ما هو موضح في هذه السياسة.</p>"}',
  '{"en": "Privacy policy explaining how we collect, use, and protect your data", "ar": "سياسة الخصوصية التي توضح كيف نجمع ونستخدم ونحمي بياناتك"}',
  true,
  2
);