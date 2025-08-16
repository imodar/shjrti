import { useDatePreference } from '@/contexts/DatePreferenceContext';

export const useDateFormat = () => {
  const { formatDate, datePreference, loading } = useDatePreference();

  // Format a single date
  const format = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    return formatDate(date);
  };

  // Format date with relative time (e.g., "منذ يومين")
  const formatRelative = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'اليوم';
    if (diffInDays === 1) return 'أمس';
    if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
    if (diffInDays < 30) return `منذ ${Math.floor(diffInDays / 7)} أسابيع`;
    if (diffInDays < 365) return `منذ ${Math.floor(diffInDays / 30)} أشهر`;
    
    return formatDate(date);
  };

  // Format date range
  const formatRange = (startDate: Date | string | null, endDate: Date | string | null): string => {
    if (!startDate && !endDate) return '';
    if (!startDate) return `حتى ${format(endDate)}`;
    if (!endDate) return `من ${format(startDate)}`;
    return `من ${format(startDate)} إلى ${format(endDate)}`;
  };

  // Format birth/death dates
  const formatLifespan = (birthDate: Date | string | null, deathDate: Date | string | null, isAlive: boolean = true): string => {
    if (!birthDate) return '';
    
    const birth = format(birthDate);
    if (isAlive) {
      return `المولود في ${birth}`;
    } else if (deathDate) {
      return `${birth} - ${format(deathDate)}`;
    } else {
      return `المولود في ${birth}`;
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