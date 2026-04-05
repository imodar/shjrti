import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type DatePreference = 'gregorian' | 'gregorian-levantine' | 'hijri';

interface DatePreferenceContextType {
  datePreference: DatePreference;
  setDatePreference: (preference: DatePreference) => Promise<void>;
  formatDate: (date: Date | string) => string;
  loading: boolean;
}

const DatePreferenceContext = createContext<DatePreferenceContextType | undefined>(undefined);

const CACHE_KEY = 'date_preference';

export const useDatePreference = () => {
  const context = useContext(DatePreferenceContext);
  if (context === undefined) {
    throw new Error('useDatePreference must be used within a DatePreferenceProvider');
  }
  return context;
};

interface DatePreferenceProviderProps {
  children: ReactNode;
}

export const DatePreferenceProvider: React.FC<DatePreferenceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize from localStorage cache immediately
  const cachedPref = localStorage.getItem(CACHE_KEY) as DatePreference | null;
  const [datePreference, setDatePreferenceState] = useState<DatePreference>(cachedPref || 'gregorian');
  const [loading, setLoading] = useState(true);

  // Load user's date preference on mount
  useEffect(() => {
    if (user) {
      loadDatePreference();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDatePreference = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('date_preference')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading date preference:', error);
        return;
      }

      if (data?.date_preference) {
        const pref = data.date_preference as DatePreference;
        setDatePreferenceState(pref);
        localStorage.setItem(CACHE_KEY, pref);
      }
    } catch (error) {
      console.error('Error in loadDatePreference:', error);
    } finally {
      setLoading(false);
    }
  };

  const setDatePreference = async (preference: DatePreference) => {
    try {
      // Update local state and cache immediately for responsive UI
      setDatePreferenceState(preference);
      localStorage.setItem(CACHE_KEY, preference);

      if (!user?.id) return;

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ date_preference: preference })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating date preference:', error);
        // Revert local state if database update fails
        loadDatePreference();
        throw error;
      }
    } catch (error) {
      console.error('Error in setDatePreference:', error);
      throw error;
    }
  };

  // Convert Gregorian date to Hijri using proper algorithm
  const toHijri = (gregorianDate: Date): string => {
    try {
      const gYear = gregorianDate.getFullYear();
      const gMonth = gregorianDate.getMonth() + 1;
      const gDay = gregorianDate.getDate();
      
      // Convert using accurate Hijri algorithm
      const jDay = Math.floor((1461 * (gYear + 4800 + Math.floor((gMonth - 14) / 12))) / 4) +
                   Math.floor((367 * (gMonth - 2 - 12 * (Math.floor((gMonth - 14) / 12)))) / 12) -
                   Math.floor((3 * (Math.floor((gYear + 4900 + Math.floor((gMonth - 14) / 12)) / 100))) / 4) +
                   gDay - 32075;
      
      const islamicJDay = jDay - 1948440.5;
      const hYear = Math.floor((30 * islamicJDay + 10646) / 10631);
      const hMonth = Math.min(12, Math.ceil((islamicJDay - 29.5 - 354 * hYear) / 29.5) + 1);
      const hDay = Math.ceil(islamicJDay - (29.5 * hMonth - 29.5) - 354 * hYear) + 1;
      
      const hijriMonths = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
        'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
      ];
      
      const monthIndex = Math.max(0, Math.min(11, Math.floor(hMonth) - 1));
      return `${Math.floor(hDay)} ${hijriMonths[monthIndex]} ${Math.floor(hYear)} هـ`;
    } catch (error) {
      console.error('Error converting to Hijri:', error);
      return gregorianDate.toLocaleDateString('ar-SA');
    }
  };

  // Format date according to user preference
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح';
    }

    if (datePreference === 'gregorian') {
      // Gregorian format in Arabic (يناير، فبراير...)
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (datePreference === 'gregorian-levantine') {
      // Levantine month names (كانون الثاني، شباط...)
      const levantineMonths = [
        'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
        'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
      ];
      
      const day = dateObj.getDate();
      const month = levantineMonths[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      
      return `${day} ${month} ${year}`;
    } else {
      // Hijri format
      const hijriResult = toHijri(dateObj);
      return hijriResult;
    }
    
  };

  const value: DatePreferenceContextType = {
    datePreference,
    setDatePreference,
    formatDate,
    loading
  };

  return (
    <DatePreferenceContext.Provider value={value}>
      {children}
    </DatePreferenceContext.Provider>
  );
};
