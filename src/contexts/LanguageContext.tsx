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
  formatPrice: (amount: number | string | undefined | null) => string;
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
  // Initialize with saved language or default to Arabic (matching HTML)
  const getInitialLanguage = () => {
    const saved = localStorage.getItem('preferred-language');
    return saved || 'ar'; // Default to Arabic to match index.html
  };

  const initialLanguage = getInitialLanguage();

  const [currentLanguage, setCurrentLanguage] = useState<string>(initialLanguage);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [translationsLoading, setTranslationsLoading] = useState(true);

  const currentLang = languages.find(lang => lang.code === currentLanguage);
  const direction = (currentLang?.direction as 'ltr' | 'rtl') || (currentLanguage === 'ar' ? 'rtl' : 'ltr');
  const currency = currentLang?.currency || (currentLanguage === 'ar' ? 'SAR' : 'USD');

  useEffect(() => {
    // Pre-hydrate translations from cache to avoid flash
    try {
      const cached = localStorage.getItem(`translations-${initialLanguage}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setTranslations(parsed);
        setTranslationsLoading(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Load languages asynchronously without blocking render
    loadLanguages();
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
      
      const savedLanguage = localStorage.getItem('preferred-language');
      if (!savedLanguage && data && data.length > 0) {
        const defaultLang = data.find(lang => lang.is_default) || data[0];
        setCurrentLanguage(defaultLang.code);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
      setLanguages([
        { code: 'ar', name: 'العربية', direction: 'rtl', is_default: true, is_active: true, currency: 'SAR' },
        { code: 'en', name: 'English', direction: 'ltr', is_default: false, is_active: true, currency: 'USD' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTranslations = async (languageCode: string) => {
    setTranslationsLoading(true);
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
      // Cache translations for instant next loads
      try { localStorage.setItem(`translations-${languageCode}`, JSON.stringify(translationMap)); } catch {}
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setTranslationsLoading(false);
    }
  };

  const setLanguage = (code: string) => {
    setCurrentLanguage(code);
    localStorage.setItem('preferred-language', code);

    // Pre-hydrate cached translations for instant UI switch
    try {
      const cached = localStorage.getItem(`translations-${code}`);
      if (cached) {
        setTranslations(JSON.parse(cached));
        setTranslationsLoading(false);
      } else {
        setTranslationsLoading(true);
      }
    } catch {
      setTranslationsLoading(true);
    }

    // Fetch latest translations in background
    loadTranslations(code);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  const formatPrice = (amount: number | string | undefined | null): string => {
    // التحقق من صحة القيمة وتحويلها لرقم
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
    const validAmount = isNaN(numericAmount) ? 0 : numericAmount;

    const currencySymbols: Record<string, string> = {
      USD: '$',
      SAR: 'ر.س'
    };

    const symbol = currencySymbols[currency] || currency;
    
    if (currency === 'SAR' && direction === 'rtl') {
      return `${validAmount.toFixed(2)} ${symbol}`;
    }
    
    return `${symbol}${validAmount.toFixed(2)}`;
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

  // Show loader until translations are fetched
  if (loading || translationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            {currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};