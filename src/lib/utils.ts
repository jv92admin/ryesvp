import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Austin, TX is in Central Time (America/Chicago)
const AUSTIN_TIMEZONE = 'America/Chicago';

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

