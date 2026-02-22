import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

// Ticket status type (matches Prisma enum)
type TicketStatus = 'YES' | 'MAYBE' | 'NO' | 'COVERED';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  ticketStatus: TicketStatus;
  coveredById: string | null;
  buyingForIds: string[];
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
    displayTitle: string;
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
  
  // Get deadline text if set
  const deadlineText = squad.deadline 
    ? ` by ${formatInTimeZone(new Date(squad.deadline), AUSTIN_TIMEZONE, 'EEE h:mm a')}`
    : '';

  // Count squad status
  const inCount = squad.members.filter(m => m.status === 'IN').length;
  const thinkingCount = squad.members.filter(m => m.status === 'THINKING').length;
  
  const squadSummary = inCount > 0 || thinkingCount > 0 
    ? ` (${inCount} in, ${thinkingCount} maybe)`
    : '';

  // Check if user is buying for others
  const buyingForCount = userMember.buyingForIds?.length || 0;

  if (buyingForCount > 0) {
    const deadlinePart = squad.deadline 
      ? ` by ${formatInTimeZone(new Date(squad.deadline), AUSTIN_TIMEZONE, 'EEE h:mm a')}`
      : '';
    return `I'm organizing ${eventName} on ${eventDate} at ${eventTime} (${venueName}). I'm getting tickets for people who say they're in${deadlinePart}. Mark your status in the plan so I can sort tickets and logistics: ${eventLink}`;
  }
  
  if (userMember.ticketStatus === 'YES') {
    return `I'm going to ${eventName} on ${eventDate} at ${eventTime}. If you're in, mark it in the plan and grab your ticket here so we can coordinate: ${eventLink}`;
  }
  
  return `Thinking about ${eventName} on ${eventDate} at ${eventTime} (${venueName}). Mark if you're in and your ticket situation in the plan so we can see if this one comes together: ${eventLink}`;
}

/**
 * Generate day-of logistics text with meetup details
 */
export function generateDayOfText(squad: Squad): string {
  const eventName = squad.event.displayTitle;
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
    text += `\n\n📍 Meetup details TBD - check the plan!`;
  }
  
  if (inMembers.length > 0) {
    text += `\n\n👥 Going: ${memberNames}`;
  }
  
  text += `\n\nOpen the plan for all the details: ${eventLink}`;
  
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
  
  return `Thinking about ${eventName} on ${eventDate} at ${eventTime} (${venueName}). Mark if you're in and your ticket situation in the plan so we can see if this one comes together: ${eventLink}`;
}
