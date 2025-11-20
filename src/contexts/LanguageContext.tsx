import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
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

// Cache version - increment this to invalidate all cached translations
const TRANSLATION_CACHE_VERSION = 5;

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
  const [hasCachedTranslations, setHasCachedTranslations] = useState(false);
  const lastLoadedLanguageRef = useRef<string | null>(null);

  const currentLang = useMemo(
    () => languages.find(lang => lang.code === currentLanguage),
    [languages, currentLanguage]
  );

  const direction = useMemo(
    () => (currentLang?.direction as 'ltr' | 'rtl') || (currentLanguage === 'ar' ? 'rtl' : 'ltr'),
    [currentLang, currentLanguage]
  );

  const currency = useMemo(
    () => currentLang?.currency || (currentLanguage === 'ar' ? 'SAR' : 'USD'),
    [currentLang, currentLanguage]
  );

  useEffect(() => {
    // Pre-hydrate translations from cache to avoid flash
    try {
      const cacheKey = `translations-${initialLanguage}`;
      const versionKey = `translations-version`;
      const cachedVersion = localStorage.getItem(versionKey);
      
      // Clear cache if version mismatch
      if (cachedVersion !== String(TRANSLATION_CACHE_VERSION)) {
        console.log(`[LanguageContext] Cache version mismatch, clearing all caches...`);
        localStorage.removeItem(`translations-ar`);
        localStorage.removeItem(`translations-en`);
        localStorage.setItem(versionKey, String(TRANSLATION_CACHE_VERSION));
        return;
      }
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        
        // Check if cache is stale (less than 100 keys means old version)
        const cacheSize = Object.keys(parsed).length;
        if (cacheSize < 100) {
          console.log(`[LanguageContext] Cache is stale (${cacheSize} keys), clearing...`);
          localStorage.removeItem(cacheKey);
        } else {
          setTranslations(parsed);
          setHasCachedTranslations(true);
          console.log(`[LanguageContext] Using cached translations (${cacheSize} keys)`);
        }
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
  }, [currentLanguage, languages]);

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
    // Prevent duplicate calls for the same language
    if (lastLoadedLanguageRef.current === languageCode) {
      console.log(`[LanguageContext] Skipping duplicate translation load for ${languageCode}`);
      return;
    }
    
    console.log(`[LanguageContext] Loading translations for ${languageCode}...`);
    lastLoadedLanguageRef.current = languageCode;
    
    try {
      // Fetch ALL translations using pagination to bypass any limits
      const translationMap: Record<string, string> = {};
      let hasMore = true;
      let offset = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language_code', languageCode)
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          data.forEach((translation) => {
            translationMap[translation.key] = translation.value;
          });
          
          // Check if we got less than pageSize, meaning we've reached the end
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            offset += pageSize;
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`[LanguageContext] Loaded ${Object.keys(translationMap).length} translations for ${languageCode}`);
      console.log(`[LanguageContext] Sample keys:`, Object.keys(translationMap).slice(0, 10));
      
      setTranslations(translationMap);
      setHasCachedTranslations(true);
      // Cache translations for instant next loads
      try { localStorage.setItem(`translations-${languageCode}`, JSON.stringify(translationMap)); } catch {}
    } catch (error) {
      console.error('[LanguageContext] Error loading translations:', error);
      lastLoadedLanguageRef.current = null;
    }
  };

  const setLanguage = (code: string) => {
    // Prevent setting the same language
    if (code === currentLanguage) {
      return;
    }
    
    setCurrentLanguage(code);
    localStorage.setItem('preferred-language', code);
    lastLoadedLanguageRef.current = null; // Reset to allow fresh loading

    // Pre-hydrate cached translations for instant UI switch
    try {
      const cached = localStorage.getItem(`translations-${code}`);
      if (cached) {
        setTranslations(JSON.parse(cached));
        setHasCachedTranslations(true);
      } else {
        setHasCachedTranslations(false);
      }
    } catch {
      setHasCachedTranslations(false);
    }

    // Fetch latest translations in background
    loadTranslations(code);
  };

  const t = (key: string, fallback?: string): string => {
    const value = translations[key] || fallback || key;
    
    // Debug specific tree_settings keys
    if (key.startsWith('tree_settings.')) {
      console.log(`[t] Key: ${key}, Value: ${value}, Has translation: ${!!translations[key]}, Total translations: ${Object.keys(translations).length}`);
    }
    
    return value;
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

  // Show loader only on initial load without cached translations
  if (loading && !hasCachedTranslations) {
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