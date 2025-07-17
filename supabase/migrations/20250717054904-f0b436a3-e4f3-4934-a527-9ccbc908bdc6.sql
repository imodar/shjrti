-- Create languages table for multi-language support
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'en', 'ar'
  name VARCHAR(50) NOT NULL, -- e.g., 'English', 'العربية'
  direction VARCHAR(3) NOT NULL DEFAULT 'ltr', -- 'ltr' or 'rtl'
  currency VARCHAR(10) DEFAULT 'USD', -- Default currency for this language
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default languages FIRST
INSERT INTO public.languages (code, name, direction, currency, is_default, is_active) VALUES
('en', 'English', 'ltr', 'USD', true, true),
('ar', 'العربية', 'rtl', 'SAR', false, true);

-- Now add language_code column to homepage_content
ALTER TABLE public.homepage_content ADD COLUMN language_code VARCHAR(10) DEFAULT 'en';

-- Add foreign key constraint
ALTER TABLE public.homepage_content ADD CONSTRAINT fk_language 
  FOREIGN KEY (language_code) REFERENCES public.languages(code);

-- Create translations table for all text content
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL, -- e.g., 'header.navigation.home'
  value TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general', -- e.g., 'navigation', 'content', 'errors'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language_code, key)
);

-- Create currencies table
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE, -- 'USD', 'SAR'
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  exchange_rate DECIMAL(10,4) DEFAULT 1.0, -- Rate relative to base currency
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add currency columns to packages
ALTER TABLE public.packages ADD COLUMN price_usd DECIMAL(10,2);
ALTER TABLE public.packages ADD COLUMN price_sar DECIMAL(10,2);

-- Create admin_settings table for admin management
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for languages
CREATE POLICY "Everyone can read active languages" 
ON public.languages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage languages" 
ON public.languages 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- RLS Policies for translations
CREATE POLICY "Everyone can read translations" 
ON public.translations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage translations" 
ON public.translations 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- RLS Policies for currencies
CREATE POLICY "Everyone can read active currencies" 
ON public.currencies 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage currencies" 
ON public.currencies 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_settings
CREATE POLICY "Admins can manage settings" 
ON public.admin_settings 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Insert default currencies
INSERT INTO public.currencies (code, name, symbol, exchange_rate, is_active) VALUES
('USD', 'US Dollar', '$', 1.0, true),
('SAR', 'Saudi Riyal', 'ر.س', 3.75, true);

-- Insert some default translations
INSERT INTO public.translations (language_code, key, value, category) VALUES
-- English translations
('en', 'nav.home', 'Home', 'navigation'),
('en', 'nav.features', 'Features', 'navigation'),
('en', 'nav.pricing', 'Pricing', 'navigation'),
('en', 'nav.contact', 'Contact', 'navigation'),
('en', 'hero.title', 'Build Your Family Tree', 'content'),
('en', 'hero.subtitle', 'Connect with your heritage and preserve your family history', 'content'),

-- Arabic translations
('ar', 'nav.home', 'الرئيسية', 'navigation'),
('ar', 'nav.features', 'المميزات', 'navigation'),
('ar', 'nav.pricing', 'الأسعار', 'navigation'),
('ar', 'nav.contact', 'تواصل معنا', 'navigation'),
('ar', 'hero.title', 'ابني شجرة عائلتك', 'content'),
('ar', 'hero.subtitle', 'تواصل مع تراثك واحفظ تاريخ عائلتك', 'content');

-- Add triggers for updated_at
CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();