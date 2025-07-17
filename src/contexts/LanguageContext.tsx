import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Language {
  code: string;
  name: string;
  direction: string;
  currency: string;
  is_active: boolean;
  is_default: boolean;
}

interface Translation {
  key: string;
  value: string;
  language_code: string;
  category: string;
}

interface LanguageContextType {
  currentLanguage: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  languages: Language[];
  translations: Record<string, string>;
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  formatPrice: (amount: number) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const currentLang = languages.find(lang => lang.code === currentLanguage);
  const direction = (currentLang?.direction as 'ltr' | 'rtl') || 'ltr';
  const currency = currentLang?.currency || 'USD';

  useEffect(() => {
    loadLanguages();
    // Load saved language from localStorage or use default
    const savedLanguage = localStorage.getItem('preferred-language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    if (currentLanguage && languages.length > 0) {
      loadTranslations(currentLanguage);
      // Update document direction
      document.documentElement.dir = direction;
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage, languages, direction]);

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadTranslations = async (languageCode: string) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language_code', languageCode);

      if (error) throw error;
      
      const translationMap: Record<string, string> = {};
      data?.forEach((translation) => {
        translationMap[translation.key] = translation.value;
      });
      
      setTranslations(translationMap);
      setLoading(false);
    } catch (error) {
      console.error('Error loading translations:', error);
      setLoading(false);
    }
  };

  const setLanguage = (code: string) => {
    setCurrentLanguage(code);
    localStorage.setItem('preferred-language', code);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  const formatPrice = (amount: number): string => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      SAR: 'ر.س'
    };

    const symbol = currencySymbols[currency] || currency;
    
    if (currency === 'SAR' && direction === 'rtl') {
      return `${amount.toFixed(2)} ${symbol}`;
    }
    
    return `${symbol}${amount.toFixed(2)}`;
  };

  const value: LanguageContextType = {
    currentLanguage,
    direction,
    currency,
    languages,
    translations,
    setLanguage,
    t,
    formatPrice,
    loading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};