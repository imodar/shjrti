import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

type DatePreference = 'gregorian' | 'hijri';

interface DatePreferenceContextType {
  datePreference: DatePreference;
  setDatePreference: (preference: DatePreference) => Promise<void>;
  formatDate: (date: Date | string) => string;
  loading: boolean;
}

const DatePreferenceContext = createContext<DatePreferenceContextType | undefined>(undefined);

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
  const [datePreference, setDatePreferenceState] = useState<DatePreference>('gregorian');
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
        setDatePreferenceState(data.date_preference as DatePreference);
      }
    } catch (error) {
      console.error('Error in loadDatePreference:', error);
    } finally {
      setLoading(false);
    }
  };

  const setDatePreference = async (preference: DatePreference) => {
    try {
      // Update local state immediately for responsive UI
      setDatePreferenceState(preference);

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

  // Convert Gregorian date to Hijri (simplified conversion)
  const toHijri = (gregorianDate: Date): string => {
    // This is a simplified conversion. For production, you might want to use a library like moment-hijri
    const year = gregorianDate.getFullYear() - 622;
    const month = gregorianDate.getMonth() + 1;
    const day = gregorianDate.getDate();
    
    const hijriMonths = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    return `${day} ${hijriMonths[month - 1]} ${year} هـ`;
  };

  // Format date according to user preference
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح';
    }

    if (datePreference === 'gregorian') {
      // Gregorian format in Arabic
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      // Hijri format
      return toHijri(dateObj);
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