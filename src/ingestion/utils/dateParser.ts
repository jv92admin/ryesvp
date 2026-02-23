/**
 * Date parsing utilities for scrapers
 */
import { toZonedTime } from 'date-fns-tz';
import { AUSTIN_TIMEZONE } from '@/lib/utils';

/**
 * Parse date string like "Sunday / Feb 1 / 2026" or "Tuesday / Feb 3 / 2026"
 * Returns a Date object with time set to 8 PM (20:00) as default
 */
export function parseMoodyCenterDate(dateStr: string, defaultTime: string = '20:00'): Date | null {
  try {
    // Format: "Sunday / Feb 1 / 2026" or "Tuesday / Feb 3 / 2026"
    const parts = dateStr.split('/').map(p => p.trim());
    if (parts.length !== 3) return null;

    const [, monthDay, year] = parts;
    // monthDay is like "Feb 1"
    const monthDayParts = monthDay.split(' ');
    if (monthDayParts.length !== 2) return null;

    const monthAbbr = monthDayParts[0]; // "Feb"
    const day = parseInt(monthDayParts[1], 10);
    const yearNum = parseInt(year, 10);

    const monthMap: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3,
      'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7,
      'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
    };

    const month = monthMap[monthAbbr];
    if (month === undefined || isNaN(day) || isNaN(yearNum)) return null;

    // Parse time (default to 8 PM)
    const [hours, minutes] = defaultTime.split(':').map(n => parseInt(n, 10));

    const date = new Date(yearNum, month, day, hours || 20, minutes || 0, 0, 0);
    return date;
  } catch (error) {
    console.error('Error parsing Moody Center date:', dateStr, error);
    return null;
  }
}

/**
 * Parse various date formats commonly found on event websites
 */
export function parseDate(dateStr: string, defaultTime: string = '20:00'): Date | null {
  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try Moody Center format
  const moodyDate = parseMoodyCenterDate(dateStr, defaultTime);
  if (moodyDate) return moodyDate;

  // Try other common formats
  // Add more parsers as needed for different venues
  return null;
}

/**
 * Infer the correct year for a month/day that has no year.
 * Many venue websites only show "2/23" without a year. This function determines
 * whether that means the current year or next year.
 *
 * Compares at the DAY level in Austin time — so an event today is never bumped
 * to next year, regardless of what time the cron runs.
 *
 * @param month 0-indexed month (0 = January)
 * @param day Day of month
 */
export function inferYear(month: number, day: number): number {
  const austinNow = toZonedTime(new Date(), AUSTIN_TIMEZONE);
  const year = austinNow.getFullYear();
  const currentMonth = austinNow.getMonth();
  const currentDay = austinNow.getDate();

  // Only bump to next year if the date is strictly before today
  if (month < currentMonth || (month === currentMonth && day < currentDay)) {
    return year + 1;
  }
  return year;
}

/**
 * Extract category from event title or description
 */
export function inferCategory(title: string, description?: string | null): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  if (text.includes('comedy') || text.includes('stand-up')) return 'COMEDY';
  if (text.includes('basketball') || text.includes('sports') || text.includes('game')) return 'SPORTS';
  if (text.includes('theater') || text.includes('play') || text.includes('musical')) return 'THEATER';
  if (text.includes('festival')) return 'FESTIVAL';
  if (text.includes('concert') || text.includes('music') || text.includes('band') || text.includes('tour')) return 'CONCERT';
  
  return 'OTHER';
}

