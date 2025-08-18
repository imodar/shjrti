import React from 'react';

interface DateDisplayProps {
  date: Date | string | null | undefined;
  format?: 'default' | 'relative' | 'lifespan';
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  isAlive?: boolean;
  className?: string;
}

// Helper function to format Gregorian dates
const formatGregorianDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toLocaleDateString('en-GB');
  } catch (error) {
    return '';
  }
};

// Helper function for relative time
const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    
    return formatGregorianDate(date);
  } catch (error) {
    return formatGregorianDate(date);
  }
};

// Helper function for lifespan
const formatLifespanGregorian = (birthDate: Date | string | null, deathDate: Date | string | null, isAlive: boolean = true): string => {
  if (!birthDate) return '';
  
  try {
    const birth = formatGregorianDate(birthDate);
    if (!birth) return '';
    
    if (isAlive) {
      return `Born ${birth}`;
    } else if (deathDate) {
      const death = formatGregorianDate(deathDate);
      if (death) {
        return `${birth} - ${death}`;
      }
    }
    return `Born ${birth}`;
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
  let formattedDate: string = '';

  try {
    switch (format) {
      case 'relative':
        formattedDate = formatRelativeTime(date);
        break;
      case 'lifespan':
        formattedDate = formatLifespanGregorian(birthDate, deathDate, isAlive);
        break;
      default:
        formattedDate = formatGregorianDate(date);
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
