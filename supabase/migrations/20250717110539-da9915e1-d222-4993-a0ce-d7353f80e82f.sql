-- Insert relationship terms translations for Arabic
INSERT INTO public.translations (key, value, language_code, category) VALUES
('father', 'أب', 'ar', 'relationships'),
('mother', 'أم', 'ar', 'relationships'),
('husband', 'زوج', 'ar', 'relationships'),
('wife', 'زوجة', 'ar', 'relationships'),
('brother', 'أخ', 'ar', 'relationships'),
('sister', 'أخت', 'ar', 'relationships'),
('son', 'ابن', 'ar', 'relationships'),
('daughter', 'ابنة', 'ar', 'relationships'),
('grandfather', 'جد', 'ar', 'relationships'),
('grandmother', 'جدة', 'ar', 'relationships'),
('uncle', 'عم', 'ar', 'relationships'),
('aunt', 'عمة', 'ar', 'relationships')
ON CONFLICT (key, language_code) DO UPDATE SET 
  value = EXCLUDED.value,
  category = EXCLUDED.category;