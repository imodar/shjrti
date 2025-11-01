-- Add quick_info field to pages table for storing additional page information
ALTER TABLE pages ADD COLUMN IF NOT EXISTS quick_info jsonb DEFAULT '{}'::jsonb;

-- Update privacy-policy page with bilingual quick info
UPDATE pages 
SET quick_info = '{
  "last_updated_label": {
    "ar": "آخر تحديث",
    "en": "Last Updated"
  },
  "applies_to_label": {
    "ar": "ينطبق على",
    "en": "Applies To"
  },
  "applies_to_value": {
    "ar": "جميع المستخدمين",
    "en": "All Users"
  },
  "data_protection_label": {
    "ar": "حماية البيانات",
    "en": "Data Protection"
  },
  "data_protection_value": {
    "ar": "متوافق مع GDPR",
    "en": "GDPR Compliant"
  },
  "contact_label": {
    "ar": "مسؤول الخصوصية",
    "en": "Privacy Officer"
  },
  "contact_value": {
    "ar": "privacy@familytree.com",
    "en": "privacy@familytree.com"
  },
  "quick_info_title": {
    "ar": "معلومات سريعة",
    "en": "Quick Information"
  },
  "intro_text": {
    "ar": "خصوصيتك مهمة بالنسبة لنا. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك.",
    "en": "Your privacy is important to us. This policy explains how we collect, use, and protect your information."
  }
}'::jsonb
WHERE slug = 'privacy-policy';

-- Update terms-conditions page with bilingual quick info
UPDATE pages 
SET quick_info = '{
  "last_updated_label": {
    "ar": "آخر تحديث",
    "en": "Last Updated"
  },
  "applies_to_label": {
    "ar": "ينطبق على",
    "en": "Applies To"
  },
  "applies_to_value": {
    "ar": "جميع المستخدمين",
    "en": "All Users"
  },
  "privacy_label": {
    "ar": "الخصوصية",
    "en": "Privacy"
  },
  "privacy_value": {
    "ar": "محمية بالكامل",
    "en": "Fully Protected"
  },
  "contact_label": {
    "ar": "للاستفسارات",
    "en": "For Inquiries"
  },
  "contact_value": {
    "ar": "support@familytree.com",
    "en": "support@familytree.com"
  },
  "quick_info_title": {
    "ar": "معلومات سريعة",
    "en": "Quick Information"
  },
  "intro_text": {
    "ar": "مرحباً بك في منصة شجرة العائلة. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدماتنا.",
    "en": "Welcome to the Family Tree platform. Please read these terms and conditions carefully before using our services."
  }
}'::jsonb
WHERE slug = 'terms-conditions';