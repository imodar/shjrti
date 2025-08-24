/**
 * Utility functions for handling dates in a way that avoids timezone issues
 */

/**
 * Converts a Date object to a local date string in YYYY-MM-DD format
 * This avoids timezone issues when saving dates to the database
 */
export const formatDateForDatabase = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  
  // Use local timezone values instead of UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Creates a Date object from a database date string (YYYY-MM-DD)
 * This ensures the date is created in local timezone
 */
export const parseDateFromDatabase = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in local timezone to avoid timezone issues
  return new Date(year, month - 1, day);
};

/**
 * Creates a safe local date object avoiding timezone issues
 */
export const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day);
};