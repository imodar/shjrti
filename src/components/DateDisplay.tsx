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

// Helper function to format dates with numbers only
const formatDateNumeric = (date: Date | string | null | undefined, formatDate: (date: Date) => string): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Get formatted date and convert month names to numbers if needed
    const formatted = formatDate(dateObj);
    
    // For Levantine format, replace month names with numbers
    const levantineMonths = [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];
    
    let result = formatted;
    levantineMonths.forEach((monthName, index) => {
      result = result.replace(monthName, String(index + 1).padStart(2, '0'));
    });
    
    return result;
  } catch (error) {
    return '';
  }
};

// Helper function for relative time
const formatRelativeTime = (date: Date | string | null | undefined, t: (key: string, fallback: string) => string, formatDate: (date: Date) => string): string => {
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
    
    return formatDateNumeric(date, formatDate);
  } catch (error) {
    return formatDateNumeric(date, formatDate);
  }
};

// Helper function for lifespan
const formatLifespanNumeric = (birthDate: Date | string | null, deathDate: Date | string | null, isAlive: boolean = true, t: (key: string, fallback: string) => string, formatDate: (date: Date) => string): string => {
  if (!birthDate) return '';
  
  try {
    const birth = formatDateNumeric(birthDate, formatDate);
    if (!birth) return '';
    
    if (isAlive) {
      return `${t('born', 'Born')} ${birth}`;
    } else if (deathDate) {
      const death = formatDateNumeric(deathDate, formatDate);
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
  const { formatDate } = useDatePreference();
  let formattedDate: string = '';

  try {
    switch (format) {
      case 'relative':
        formattedDate = formatRelativeTime(date, t, formatDate);
        break;
      case 'lifespan':
        formattedDate = formatLifespanNumeric(birthDate, deathDate, isAlive, t, formatDate);
        break;
      default:
        formattedDate = formatDateNumeric(date, formatDate);
        break;
    }
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
