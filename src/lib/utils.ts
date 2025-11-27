import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';

export function formatEventDate(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  if (isThisWeek(date)) {
    return format(date, "EEEE 'at' h:mm a"); // "Friday at 8:00 PM"
  }
  return format(date, "EEE, MMM d 'at' h:mm a"); // "Fri, Jan 15 at 8:00 PM"
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

