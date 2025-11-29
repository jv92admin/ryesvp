import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  budget: string | null;
  ticketStatus: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS';
  buyingForCount: number | null;
  isOrganizer: boolean;
  user: {
    displayName: string | null;
    email: string;
  };
}

interface Squad {
  id: string;
  eventId: string;
  createdById: string;
  meetTime: string | null;
  meetSpot: string | null;
  deadline: string | null;
  playlistUrl: string | null;
  event: {
    id: string;
    title: string;
    displayTitle: string; // Canonical title (TM preferred or fallback)
    startDateTime: string;
    venue: {
      name: string;
    };
  };
  members: SquadMember[];
}

/**
 * Generate share plan text based on user's ticket status and squad state
 */
export function generateSharePlanText(
  squad: Squad,
  currentUserId: string
): string {
  const userMember = squad.members.find(m => m.userId === currentUserId);
  if (!userMember) {
    return generateGenericShareText(squad);
  }

  const eventName = squad.event.displayTitle;
  const eventDate = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d');
  const eventTime = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'h:mm a');
  const venueName = squad.event.venue.name;
  const eventLink = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || ''}/events/${squad.event.id}`;
  
  // Get budget context from user and squad
  const budgetText = getBudgetText(userMember.budget);
  
  // Get deadline text if set
  const deadlineText = squad.deadline 
    ? ` by ${formatInTimeZone(new Date(squad.deadline), AUSTIN_TIMEZONE, 'EEE h:mm a')}`
    : '';

  // Count squad status
  const inCount = squad.members.filter(m => m.status === 'IN').length;
  const thinkingCount = squad.members.filter(m => m.status === 'THINKING').length;
  
  const squadSummary = inCount > 0 || thinkingCount > 0 
    ? ` (${inCount} in, ${thinkingCount} thinking)`
    : '';

  switch (userMember.ticketStatus) {
    case 'BUYING_FOR_OTHERS':
      return `I'm organizing ${eventName} on ${eventDate} at ${eventTime} (${venueName}). ${budgetText}I'm buying tickets for people who confirm they're in${deadlineText}. Mark your status here: ${eventLink} and send me your Venmo!${squadSummary}`;
    
    case 'BUYING_OWN':
      return `Going to ${eventName} on ${eventDate} at ${eventTime}${budgetText ? ` (budget: ${budgetText.toLowerCase().trim()})` : ''}. If you're in, mark it and grab your own ticket so we can coordinate: ${eventLink}${squadSummary}`;
    
    default:
      return `Interested in ${eventName} on ${eventDate} at ${eventTime} (${venueName}). Mark if you're in & your budget/ticket situation (click "View Squad"): ${eventLink}${squadSummary}`;
  }
}

/**
 * Generate day-of logistics text with meetup details
 */
export function generateDayOfText(squad: Squad): string {
  const eventName = squad.event.displayTitle;
  const eventDate = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'MMM d');
  const eventTime = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'h:mm a');
  const eventLink = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || ''}/events/${squad.event.id}`;
  
  const inMembers = squad.members.filter(m => m.status === 'IN');
  const memberNames = inMembers
    .map(m => m.user.displayName || m.user.email.split('@')[0])
    .join(', ');

  let text = `Tonight: ${eventName} at ${eventTime}! 🎵`;
  
  if (squad.meetTime && squad.meetSpot) {
    const meetTime = formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'h:mm a');
    text += `\n\n📍 Meeting at ${meetTime} at ${squad.meetSpot}, then heading to the show.`;
  } else if (squad.meetTime) {
    const meetTime = formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'h:mm a');
    text += `\n\n⏰ Meeting at ${meetTime} (location TBD).`;
  } else if (squad.meetSpot) {
    text += `\n\n📍 Meeting at ${squad.meetSpot} (time TBD).`;
  } else {
    text += `\n\n📍 Meetup details TBD - check the squad!`;
  }
  
  if (inMembers.length > 0) {
    text += `\n\n👥 Going: ${memberNames}`;
  }
  
  text += `\n\nView squad & event details: ${eventLink}`;
  
  return text;
}

/**
 * Generic share text for when user status is unclear
 */
function generateGenericShareText(squad: Squad): string {
  const eventName = squad.event.displayTitle;
  const eventDate = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d');
  const eventTime = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'h:mm a');
  const venueName = squad.event.venue.name;
  const eventLink = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || ''}/events/${squad.event.id}`;
  
  return `Planning to go to ${eventName} on ${eventDate} at ${eventTime} (${venueName}). Join our squad (click "View Squad" on event page): ${eventLink}`;
}

/**
 * Convert budget enum to human readable text
 */
function getBudgetText(budget: string | null): string {
  switch (budget) {
    case 'UNDER_50': return 'Budget is under $50. ';
    case 'FIFTY_TO_100': return 'Budget is around $50-100. ';
    case 'OVER_100': return 'Budget is $100+. ';
    default: return '';
  }
}
