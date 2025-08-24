import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDatePreference } from '@/contexts/DatePreferenceContext';

interface DateDisplayProps {
  date: Date | string | null | undefined;
  format?: 'default' | 'relative' | 'lifespan';
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  isAlive?: boolean;
  className?: string;
}

// Helper function to format dates with numbers only and "/" separators
const formatDateNumeric = (date: Date | string | null | undefined, formatDate: (date: Date) => string, datePreference: string): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Always format as DD/MM/YYYY regardless of user preference for display consistency
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '';
  }
};

// Helper function for relative time
const formatRelativeTime = (date: Date | string | null | undefined, t: (key: string, fallback: string) => string, formatDate: (date: Date) => string, datePreference: string): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t('today', 'Today');
    if (diffInDays === 1) return t('yesterday', 'Yesterday');
    if (diffInDays < 7) return `${diffInDays.toLocaleString('en')} ${t('days_ago', 'days ago')}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7).toLocaleString('en')} ${t('weeks_ago', 'weeks ago')}`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30).toLocaleString('en')} ${t('months_ago', 'months ago')}`;
    
    return formatDateNumeric(date, formatDate, datePreference);
  } catch (error) {
    return formatDateNumeric(date, formatDate, datePreference);
  }
};

// Helper function for lifespan
const formatLifespanNumeric = (birthDate: Date | string | null, deathDate: Date | string | null, isAlive: boolean = true, t: (key: string, fallback: string) => string, formatDate: (date: Date) => string, datePreference: string): string => {
  if (!birthDate) return '';
  
  try {
    const birth = formatDateNumeric(birthDate, formatDate, datePreference);
    if (!birth) return '';
    
    if (isAlive) {
      return `${t('born', 'Born')} ${birth}`;
    } else if (deathDate) {
      const death = formatDateNumeric(deathDate, formatDate, datePreference);
      if (death) {
        return `${birth} - ${death}`;
      }
    }
    return `${t('born', 'Born')} ${birth}`;
  } catch (error) {
    return '';
  }
};

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'default',
  birthDate,
  deathDate,
  isAlive = true,
  className = ''
}) => {
  const { t } = useLanguage();
  const { formatDate, datePreference } = useDatePreference();
  let formattedDate: string = '';

  // Debug logging
  console.log('DateDisplay - datePreference:', datePreference);
  console.log('DateDisplay - input date:', date);
  console.log('DateDisplay - format:', format);

  try {
    switch (format) {
      case 'relative':
        formattedDate = formatRelativeTime(date, t, formatDate, datePreference);
        break;
      case 'lifespan':
        formattedDate = formatLifespanNumeric(birthDate, deathDate, isAlive, t, formatDate, datePreference);
        break;
      default:
        formattedDate = formatDateNumeric(date, formatDate, datePreference);
        break;
    }
    
    // Debug logging
    console.log('DateDisplay - formatted result:', formattedDate);
  } catch (error) {
    console.error('Error in DateDisplay:', error);
    formattedDate = '';
  }

  // Don't render anything if no valid date
  if (!formattedDate) {
    return null;
  }

  return <span className={className}>{formattedDate}</span>;
};

// Convenience components for common use cases
export const BirthDateDisplay: React.FC<{ birthDate: Date | string | null; className?: string }> = ({ birthDate, className }) => (
  <DateDisplay date={birthDate} className={className} />
);

export const RelativeDateDisplay: React.FC<{ date: Date | string | null; className?: string }> = ({ date, className }) => (
  <DateDisplay date={date} format="relative" className={className} />
);

export const LifespanDisplay: React.FC<{ 
  birthDate: Date | string | null; 
  deathDate?: Date | string | null; 
  isAlive?: boolean;
  className?: string;
}> = ({ birthDate, deathDate, isAlive = true, className }) => (
  <DateDisplay 
    date={null} 
    format="lifespan" 
    birthDate={birthDate} 
    deathDate={deathDate} 
    isAlive={isAlive}
    className={className}
  />
);
