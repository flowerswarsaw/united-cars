/**
 * Date and timezone formatting utilities
 * ISO 8601 standard for date storage
 *
 * Modern CRM Standard:
 * - Store dates in ISO 8601 format (2025-11-25T10:30:00.000Z)
 * - Always store in UTC
 * - Support IANA timezone identifiers
 * - Consistent date handling across all entities
 */

/**
 * Format date for storage in ISO 8601 UTC format
 *
 * @param date - Date object or ISO string
 * @returns ISO 8601 formatted string (YYYY-MM-DDTHH:mm:ss.sssZ)
 *
 * Examples:
 * - new Date('2025-11-25 10:30:00') → "2025-11-25T10:30:00.000Z"
 * - "2025-11-25" → "2025-11-25T00:00:00.000Z"
 */
export const formatDateForStorage = (date: Date | string): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDateForStorage:', date);
      return '';
    }

    // Return ISO 8601 format in UTC
    return dateObj.toISOString();
  } catch (error) {
    console.warn('Error formatting date for storage:', error);
    return '';
  }
};

/**
 * Parse ISO 8601 date string to Date object
 *
 * @param isoString - ISO 8601 formatted string
 * @returns Date object or null if invalid
 */
export const parseStoredDate = (isoString: string): Date | null => {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('Error parsing stored date:', error);
    return null;
  }
};

/**
 * Format date for display (localized)
 *
 * @param date - Date object, ISO string, or timestamp
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * Examples:
 * - formatDateForDisplay(date) → "Nov 25, 2025"
 * - formatDateForDisplay(date, 'en-US', { dateStyle: 'full' }) → "Tuesday, November 25, 2025"
 */
export const formatDateForDisplay = (
  date: Date | string | number,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Format date and time for display
 *
 * @param date - Date object, ISO string, or timestamp
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date and time string
 *
 * Examples:
 * - formatDateTimeForDisplay(date) → "Nov 25, 2025, 10:30 AM"
 */
export const formatDateTimeForDisplay = (
  date: Date | string | number,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options
  };

  return formatDateForDisplay(date, locale, defaultOptions);
};

/**
 * Format date relative to now (e.g., "2 hours ago", "in 3 days")
 *
 * @param date - Date object, ISO string, or timestamp
 * @param locale - Locale string (default: 'en-US')
 * @returns Relative time string
 *
 * Examples:
 * - formatRelativeDate(pastDate) → "2 hours ago"
 * - formatRelativeDate(futureDate) → "in 3 days"
 */
export const formatRelativeDate = (
  date: Date | string | number,
  locale: string = 'en-US'
): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    const isPast = diffMs < 0;
    const suffix = isPast ? 'ago' : 'from now';
    const prefix = isPast ? '' : 'in ';

    if (diffSec < 60) return isPast ? 'just now' : 'in a few seconds';
    if (diffMin < 60) return `${prefix}${diffMin} minute${diffMin === 1 ? '' : 's'} ${suffix}`;
    if (diffHour < 24) return `${prefix}${diffHour} hour${diffHour === 1 ? '' : 's'} ${suffix}`;
    if (diffDay < 7) return `${prefix}${diffDay} day${diffDay === 1 ? '' : 's'} ${suffix}`;
    if (diffWeek < 4) return `${prefix}${diffWeek} week${diffWeek === 1 ? '' : 's'} ${suffix}`;
    if (diffMonth < 12) return `${prefix}${diffMonth} month${diffMonth === 1 ? '' : 's'} ${suffix}`;
    return `${prefix}${diffYear} year${diffYear === 1 ? '' : 's'} ${suffix}`;
  } catch (error) {
    console.warn('Error formatting relative date:', error);
    return '';
  }
};

/**
 * Check if a date is valid
 *
 * @param date - Date object, ISO string, or timestamp
 * @returns true if date is valid
 */
export const isValidDate = (date: Date | string | number): boolean => {
  if (!date) return false;

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
};

/**
 * Get date range (start and end of day, week, month, year)
 *
 * @param period - 'day' | 'week' | 'month' | 'year'
 * @param date - Reference date (default: now)
 * @returns Object with start and end dates in ISO format
 */
export const getDateRange = (
  period: 'day' | 'week' | 'month' | 'year',
  date: Date = new Date()
): { start: string; end: string } => {
  const d = new Date(date);
  let start: Date;
  let end: Date;

  switch (period) {
    case 'day':
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      break;

    case 'week':
      const dayOfWeek = d.getDay();
      start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case 'month':
      start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      break;

    case 'year':
      start = new Date(d.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
      break;

    default:
      start = d;
      end = d;
  }

  return {
    start: formatDateForStorage(start),
    end: formatDateForStorage(end)
  };
};

/**
 * Add time to a date
 *
 * @param date - Date object or ISO string
 * @param amount - Amount to add
 * @param unit - 'days' | 'hours' | 'minutes' | 'months' | 'years'
 * @returns New Date object
 */
export const addTime = (
  date: Date | string,
  amount: number,
  unit: 'days' | 'hours' | 'minutes' | 'months' | 'years'
): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);

  switch (unit) {
    case 'minutes':
      dateObj.setMinutes(dateObj.getMinutes() + amount);
      break;
    case 'hours':
      dateObj.setHours(dateObj.getHours() + amount);
      break;
    case 'days':
      dateObj.setDate(dateObj.getDate() + amount);
      break;
    case 'months':
      dateObj.setMonth(dateObj.getMonth() + amount);
      break;
    case 'years':
      dateObj.setFullYear(dateObj.getFullYear() + amount);
      break;
  }

  return dateObj;
};

/**
 * Format date for form input (YYYY-MM-DD)
 *
 * @param date - Date object, ISO string, or timestamp
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date: Date | string | number): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Format datetime for form input (YYYY-MM-DDTHH:mm)
 *
 * @param date - Date object, ISO string, or timestamp
 * @returns Datetime string in YYYY-MM-DDTHH:mm format
 */
export const formatDateTimeForInput = (date: Date | string | number): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.warn('Error formatting datetime for input:', error);
    return '';
  }
};
