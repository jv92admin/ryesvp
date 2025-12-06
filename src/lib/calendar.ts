/**
 * Calendar Export Utilities
 * Generate ICS files and Google Calendar URLs for squad plans
 */

export type CalendarType = 'GOOGLE' | 'APPLE' | 'OUTLOOK';

interface CalendarEvent {
  title: string;
  startDateTime: string;
  endDateTime?: string;
  location: string;
  description: string;
  url?: string;
}

interface Squad {
  id: string;
  event: {
    displayTitle: string;
    startDateTime: string;
    venue: {
      name: string;
      city: string | null;
      state: string | null;
    };
  };
  members: Array<{
    user: {
      displayName: string | null;
    };
  }>;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Build event description with squad members
 */
function buildDescription(squad: Squad, baseUrl: string): string {
  const memberNames = squad.members
    .map(m => m.user.displayName || 'Someone')
    .join(', ');
  
  const planUrl = `${baseUrl}/squads/${squad.id}`;
  
  return `Plan with: ${memberNames}\n\nView plan: ${planUrl}`;
}

/**
 * Build location string
 */
function buildLocation(squad: Squad): string {
  const venue = squad.event.venue;
  const parts = [venue.name];
  if (venue.city) parts.push(venue.city);
  if (venue.state) parts.push(venue.state);
  return parts.join(', ');
}

/**
 * Generate ICS (iCalendar) file content
 * Works with Apple Calendar, Outlook, and most calendar apps
 */
export function generateICS(squad: Squad, baseUrl: string): string {
  const startDate = new Date(squad.event.startDateTime);
  // Assume 3 hour event if no end time
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  
  const description = buildDescription(squad, baseUrl);
  const location = buildLocation(squad);
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RyesVP//Plan Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ryesvp-squad-${squad.id}@ryesvp.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICS(squad.event.displayTitle)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `URL:${baseUrl}/squads/${squad.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  return icsContent;
}

/**
 * Generate Google Calendar URL
 * Opens Google Calendar with pre-filled event details
 */
export function generateGoogleCalendarURL(squad: Squad, baseUrl: string): string {
  const startDate = new Date(squad.event.startDateTime);
  // Assume 3 hour event if no end time
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  
  const description = buildDescription(squad, baseUrl);
  const location = buildLocation(squad);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: squad.event.displayTitle,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: description,
    location: location,
    sprop: `website:${baseUrl}/squads/${squad.id}`,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Trigger download of ICS file
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to calendar based on type
 */
export function exportToCalendar(
  squad: Squad,
  type: CalendarType,
  baseUrl: string
): void {
  if (type === 'GOOGLE') {
    const url = generateGoogleCalendarURL(squad, baseUrl);
    window.open(url, '_blank');
  } else {
    // APPLE and OUTLOOK both use ICS format
    const icsContent = generateICS(squad, baseUrl);
    const filename = `${squad.event.displayTitle.replace(/[^a-zA-Z0-9]/g, '-')}.ics`;
    downloadICS(icsContent, filename);
  }
}

/**
 * Get display name for calendar type
 */
export function getCalendarDisplayName(type: CalendarType): string {
  switch (type) {
    case 'GOOGLE':
      return 'Google Calendar';
    case 'APPLE':
      return 'Apple Calendar';
    case 'OUTLOOK':
      return 'Outlook';
    default:
      return 'Calendar';
  }
}

/**
 * Get icon for calendar type (emoji for now)
 */
export function getCalendarIcon(type: CalendarType): string {
  switch (type) {
    case 'GOOGLE':
      return '📅';
    case 'APPLE':
      return '🍎';
    case 'OUTLOOK':
      return '📧';
    default:
      return '📅';
  }
}

