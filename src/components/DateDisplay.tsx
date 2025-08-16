import React from 'react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface DateDisplayProps {
  date: Date | string | null | undefined;
  format?: 'default' | 'relative' | 'lifespan';
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  isAlive?: boolean;
  className?: string;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'default',
  birthDate,
  deathDate,
  isAlive = true,
  className = ''
}) => {
  const { format: formatDate, formatRelative, formatLifespan, loading } = useDateFormat();

  if (loading) {
    return <span className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-20 inline-block ${className}`}></span>;
  }

  let formattedDate: string;

  switch (format) {
    case 'relative':
      formattedDate = formatRelative(date);
      break;
    case 'lifespan':
      formattedDate = formatLifespan(birthDate, deathDate, isAlive);
      break;
    default:
      formattedDate = formatDate(date);
      break;
  }

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