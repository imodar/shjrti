-- Add missing English translations for auth form fields
INSERT INTO translations (language_code, key, value, category) VALUES 
('en', 'email_placeholder', 'example@domain.com', 'auth'),
('en', 'phone_placeholder', '+966 50 123 4567', 'auth'),
('en', 'first_name', 'First Name', 'auth'),
('en', 'last_name', 'Last Name', 'auth'),
('en', 'confirm_password', 'Confirm Password', 'auth'),
('en', 'phone', 'Phone Number', 'auth');