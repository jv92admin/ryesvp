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

function getPlanLink(squadId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  return `${origin}/squads/${squadId}`;
}

/**
 * Generate share plan text based on user's ticket status and squad state.
 *
 * Templates follow the share-curator spec:
 *   hook -> details -> link. No product language, no feature explanations.
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
  const venueName = squad.event.venue.name;
  const planLink = getPlanLink(squad.id);

  // Check if user is buying for others (organizer buying tickets)
  const buyingForCount = userMember.buyingForIds?.length || 0;

  if (buyingForCount > 0) {
    return `${eventName} — ${eventDate}\n${venueName}\n\nI'm grabbing tickets — are you in?\n${planLink}`;
  }

  if (userMember.ticketStatus === 'YES') {
    return `${eventName} — ${eventDate}\n${venueName}\n\nI've got my ticket — you coming?\n${planLink}`;
  }

  return `${eventName} — ${eventDate}\n${venueName}\n\nAre you in? ${planLink}`;
}

/**
 * Generate day-of share text with meetup details.
 *
 * No emoji. Day-of texts are practical — people are checking these
 * while getting ready. Just clean info.
 */
export function generateDayOfText(squad: Squad): string {
  const eventName = squad.event.displayTitle;
  const eventTime = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'h:mm a');
  const venueName = squad.event.venue.name;
  const planLink = getPlanLink(squad.id);

  let text = `Tonight — ${eventName}\n${venueName} · Doors at ${eventTime}`;

  if (squad.meetTime && squad.meetSpot) {
    const meetTime = formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'h:mm a');
    text += `\n\nMeeting at ${squad.meetSpot} at ${meetTime}`;
  } else if (squad.meetTime) {
    const meetTime = formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'h:mm a');
    text += `\n\nMeeting at ${meetTime}`;
  } else if (squad.meetSpot) {
    text += `\n\nMeeting at ${squad.meetSpot}`;
  }

  text += `\n\n${planLink}`;

  return text;
}

/**
 * Generic share text for when user status is unclear (member inviting others)
 */
function generateGenericShareText(squad: Squad): string {
  const eventName = squad.event.displayTitle;
  const eventDate = formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d');
  const venueName = squad.event.venue.name;
  const planLink = getPlanLink(squad.id);

  return `${eventName} — ${eventDate}\n${venueName}\n\nA few of us are going. You down?\n${planLink}`;
}
