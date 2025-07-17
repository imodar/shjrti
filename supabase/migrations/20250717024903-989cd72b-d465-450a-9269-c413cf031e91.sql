-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table for regular users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  package_id UUID REFERENCES public.packages(id),
  subscription_status TEXT DEFAULT 'active',
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create family members table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  family_id UUID REFERENCES public.families(id),
  package_id UUID REFERENCES public.packages(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create store orders table
CREATE TABLE public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create homepage content table
CREATE TABLE public.homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default homepage content
INSERT INTO public.homepage_content (section, content) VALUES
('hero', '{"title": "Preserve Your Family Legacy", "subtitle": "Create beautiful family trees and preserve memories for generations", "cta_text": "Start Building Your Tree"}'),
('features', '{"items": [{"title": "Easy Tree Building", "description": "Intuitive interface for creating family trees"}, {"title": "Memory Preservation", "description": "Store photos, stories, and documents"}, {"title": "Collaboration", "description": "Work together with family members"}]}'),
('pricing', '{"title": "Choose Your Plan", "subtitle": "Find the perfect plan for your family"}');

-- Insert default packages
INSERT INTO public.packages (name, description, price, features) VALUES
('Basic', 'Perfect for small families', 9.99, '["Up to 50 family members", "Basic templates", "Photo storage"]'),
('Premium', 'Great for growing families', 19.99, '["Up to 200 family members", "Premium templates", "Unlimited photos", "Document storage"]'),
('Enterprise', 'For large family networks', 39.99, '["Unlimited family members", "All templates", "Unlimited storage", "Priority support", "Advanced features"]');

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Admin policies (admin can do everything)
CREATE POLICY "Admins can do everything on admin_users" ON public.admin_users
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on profiles" ON public.profiles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on packages" ON public.packages
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on families" ON public.families
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on family_members" ON public.family_members
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on invoices" ON public.invoices
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on store_orders" ON public.store_orders
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can do everything on homepage_content" ON public.homepage_content
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Public read policies for packages and homepage content
CREATE POLICY "Everyone can read packages" ON public.packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can read homepage content" ON public.homepage_content
FOR SELECT USING (is_active = true);

-- User policies for their own data
CREATE POLICY "Users can read their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can read their families" ON public.families
FOR SELECT USING (
  creator_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.family_members WHERE family_id = families.id AND user_id = auth.uid())
);

CREATE POLICY "Users can read their invoices" ON public.invoices
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can read their store orders" ON public.store_orders
FOR SELECT USING (user_id = auth.uid());

-- Update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_orders_updated_at BEFORE UPDATE ON public.store_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_content_updated_at BEFORE UPDATE ON public.homepage_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();