INSERT INTO translations (key, language_code, value, category) VALUES
('billing.paypal_final_amount', 'ar', 'المبلغ النهائي يحسب من PayPal', 'billing'),
('billing.paypal_final_amount', 'en', 'Final amount is calculated by PayPal', 'billing'),
('billing.sar', 'ar', 'ريال', 'billing'),
('billing.sar', 'en', 'SAR', 'billing')
ON CONFLICT (key, language_code) DO NOTHING;