import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// Austin, TX is in Central Time (America/Chicago)
export const AUSTIN_TIMEZONE = 'America/Chicago';

/**
 * Create a UTC Date from Austin local time components.
 * Use this in scrapers to ensure times are stored correctly regardless of server timezone.
 * 
 * Example: createAustinDate(2026, 1, 30, 19, 0) creates "Jan 30, 2026 7:00 PM Austin time" as UTC
 */
export function createAustinDate(
  year: number,
  month: number,  // 0-indexed (0 = January)
  day: number,
  hour: number = 19,  // Default to 7 PM
  minute: number = 0
): Date {
  // Create a date string that fromZonedTime can parse
  // fromZonedTime treats the input as being in the specified timezone
  const dateInAustin = new Date(year, month, day, hour, minute, 0, 0);
  return fromZonedTime(dateInAustin, AUSTIN_TIMEZONE);
}

export function formatEventDate(date: Date): string {
  // Convert to Central Time for display
  const centralTime = toZonedTime(date, AUSTIN_TIMEZONE);
  
  if (isToday(centralTime)) {
    return `Today at ${formatInTimeZone(date, AUSTIN_TIMEZONE, 'h:mm a')}`;
  }
  if (isTomorrow(centralTime)) {
    return `Tomorrow at ${formatInTimeZone(date, AUSTIN_TIMEZONE, 'h:mm a')}`;
  }
  if (isThisWeek(centralTime)) {
    return formatInTimeZone(date, AUSTIN_TIMEZONE, "EEEE 'at' h:mm a"); // "Friday at 8:00 PM"
  }
  return formatInTimeZone(date, AUSTIN_TIMEZONE, "EEE, MMM d 'at' h:mm a"); // "Fri, Jan 15 at 8:00 PM"
}

export function formatDateHeading(dateString: string): string {
  // dateString is in format "YYYY-MM-DD" - parse it as local date
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d'); // "Friday, January 15"
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if a date is within the last N hours
 */
export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return diff < hours * 60 * 60 * 1000 && diff > 0;
}

/**
 * Check if an event was added recently (within 48 hours)
 */
export function isNewListing(createdAt: Date): boolean {
  return isWithinHours(createdAt, 48);
}

/**
 * Client-side grouping of events by date
 * Similar to server-side groupEventsByDate but handles JSON date strings
 */
export function groupEventsByDateClient<T extends { startDateTime: Date | string }>(
  events: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  for (const event of events) {
    // Handle both Date objects and ISO strings from JSON
    const date = typeof event.startDateTime === 'string' 
      ? new Date(event.startDateTime) 
      : event.startDateTime;
    
    // Convert to Central Time before extracting date components
    const centralTime = toZonedTime(date, AUSTIN_TIMEZONE);
    const year = centralTime.getFullYear();
    const month = String(centralTime.getMonth() + 1).padStart(2, '0');
    const day = String(centralTime.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in Central Time
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  }
  
  return grouped;
}

