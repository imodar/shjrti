// Security utilities for input validation and sanitization

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potential XSS vectors while preserving Arabic text
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:(?!image)/gi, '')
    .trim();
};

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Allow only safe HTML tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'span'];
  const allowedTagsRegex = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\b)[^>]*>`, 'gi');
  
  return sanitizeInput(html.replace(allowedTagsRegex, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateName = (name: string): boolean => {
  if (!name || name.trim().length < 2) return false;
  // Allow Arabic, English letters, spaces, and common name characters
  const nameRegex = /^[\u0600-\u06FFa-zA-Z\s\-\'\.]+$/;
  return nameRegex.test(name.trim());
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  // Basic international phone number validation
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7;
};

export const sanitizeFormData = (formData: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else if (typeof value === 'object' && value !== null) {
      // Handle date fields specially
      if (key === 'birthDate' || key === 'deathDate') {
        sanitized[key] = value && typeof value === 'string' && value.trim() ? value : null;
      } else if (Array.isArray(value)) {
        // Handle arrays
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null ? sanitizeFormData(item) : item
        );
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeFormData(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export const createSecureError = (userMessage: string, logDetails?: any): Error => {
  // Log detailed error for debugging without exposing to user
  if (logDetails) {
    console.error('Security event:', {
      message: userMessage,
      details: logDetails,
      timestamp: new Date().toISOString()
    });
  }
  
  // Return sanitized user-friendly error
  return new Error(sanitizeInput(userMessage));
};