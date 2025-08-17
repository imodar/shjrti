
import { useDatePreference } from '@/contexts/DatePreferenceContext';

export const useDateFormat = () => {
  const { formatDate, datePreference, loading } = useDatePreference();

  // Format a single date with proper validation
  const format = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided to format:', date);
        return 'تاريخ غير صحيح';
      }
      return formatDate(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'تاريخ غير صحيح';
    }
  };

  // Format date with relative time (e.g., "منذ يومين")
  const formatRelative = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'تاريخ غير صحيح';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'اليوم';
      if (diffInDays === 1) return 'أمس';
      if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
      if (diffInDays < 30) return `منذ ${Math.floor(diffInDays / 7)} أسابيع`;
      if (diffInDays < 365) return `منذ ${Math.floor(diffInDays / 30)} أشهر`;
      
      return format(date);
    } catch (error) {
      console.error('Error formatting relative date:', error, date);
      return format(date);
    }
  };

  // Format date range
  const formatRange = (startDate: Date | string | null, endDate: Date | string | null): string => {
    if (!startDate && !endDate) return '';
    if (!startDate) return `حتى ${format(endDate)}`;
    if (!endDate) return `من ${format(startDate)}`;
    return `من ${format(startDate)} إلى ${format(endDate)}`;
  };

  // Format birth/death dates with proper validation
  const formatLifespan = (birthDate: Date | string | null, deathDate: Date | string | null, isAlive: boolean = true): string => {
    if (!birthDate) return '';
    
    try {
      const birth = format(birthDate);
      if (!birth || birth === 'تاريخ غير صحيح') return '';
      
      if (isAlive) {
        return `المولود في ${birth}`;
      } else if (deathDate) {
        const death = format(deathDate);
        if (death && death !== 'تاريخ غير صحيح') {
          return `${birth} - ${death}`;
        }
      }
      return `المولود في ${birth}`;
    } catch (error) {
      console.error('Error formatting lifespan:', error, birthDate, deathDate);
      return '';
    }
  };

  return {
    format,
    formatRelative,
    formatRange,
    formatLifespan,
    datePreference,
    loading
  };
};
