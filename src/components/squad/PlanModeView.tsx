'use client';

import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui';
import { SquadStatusControls } from './SquadStatusControls';
import { SquadGuestsSection } from './SquadGuestsSection';
import { SquadTicketsSection } from './SquadTicketsSection';
import { SquadPriceGuideCard } from './SquadPriceGuideCard';
import { SquadMemberList } from './SquadMemberList';

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
  guestCount: number;
  isOrganizer: boolean;
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface Squad {
  id: string;
  eventId: string;
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
      city: string | null;
      state: string | null;
    };
  };
  members: SquadMember[];
}

interface PlanModeViewProps {
  squad: Squad;
  currentUserId: string;
  isOrganizer: boolean;
  onStatusUpdate: (updates: { status?: 'THINKING' | 'IN' | 'OUT' }) => void;
  onSquadRefresh: () => void;
  onSharePlan: () => void;
  onShareDayOf: () => void;
  onInvite: () => void;
  onLeaveSquad: () => void;
  copying: string | null;
}

export function PlanModeView({
  squad,
  currentUserId,
  isOrganizer,
  onStatusUpdate,
  onSquadRefresh,
  onSharePlan,
  onShareDayOf,
  onInvite,
  onLeaveSquad,
  copying,
}: PlanModeViewProps) {
  const dateFormatted = formatInTimeZone(
    new Date(squad.event.startDateTime),
    AUSTIN_TIMEZONE,
    'EEE, MMM d'
  );
  const timeFormatted = formatInTimeZone(
    new Date(squad.event.startDateTime),
    AUSTIN_TIMEZONE,
    'h:mm a'
  );
  const venueLocation = squad.event.venue.city && squad.event.venue.state
    ? `, ${squad.event.venue.city}, ${squad.event.venue.state}`
    : '';

  const currentMember = squad.members.find(m => m.userId === currentUserId);
  const isOut = currentMember?.status === 'OUT';

  return (
    <div className="space-y-3">
      {/* Compact Event Header */}
      <Link
        href={`/events/${squad.eventId}`}
        className="block bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
      >
        <h1 className="font-semibold text-gray-900 text-sm line-clamp-1">
          {squad.event.displayTitle}
        </h1>
        <div className="text-xs text-gray-500 mt-0.5">
          {dateFormatted} • {timeFormatted} • {squad.event.venue.name}{venueLocation}
        </div>
      </Link>

      {/* Your Status + Guests + Tickets (combined card) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-3">
        {/* Going? */}
        <SquadStatusControls
          squad={squad}
          currentUserId={currentUserId}
          onStatusUpdate={onStatusUpdate}
        />
        
        {/* Guests? - only show if not OUT */}
        {!isOut && currentMember && (
          <SquadGuestsSection
            squadId={squad.id}
            currentGuestCount={currentMember.guestCount || 0}
            onUpdate={onSquadRefresh}
          />
        )}
        
        {/* Ticket? - only show if not OUT */}
        {!isOut && (
          <SquadTicketsSection
            squadId={squad.id}
            members={squad.members}
            currentUserId={currentUserId}
            onUpdate={onSquadRefresh}
          />
        )}
      </div>

      {/* Price Guide */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <SquadPriceGuideCard
          squadId={squad.id}
          currentUserId={currentUserId}
        />
      </div>

      {/* Squad Member List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <SquadMemberList
          squad={squad}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onInvite={onInvite}
        />
      </div>

      {/* Share Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onSharePlan}
            disabled={copying === 'plan'}
            className={`flex-1 ${squad.members.length === 1 ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}
          >
            {copying === 'plan' ? '✓ Copied!' : 'Share Plan'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onShareDayOf}
            disabled={copying === 'dayof' || (!squad.meetTime && !squad.meetSpot)}
            className="flex-1"
            title={(!squad.meetTime && !squad.meetSpot) ? 'Set meetup details first' : ''}
          >
            {copying === 'dayof' ? '✓ Copied!' : 'Share Day-of'}
          </Button>
        </div>
      </div>

      {/* Leave Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <Button
          variant="danger"
          size="sm"
          onClick={onLeaveSquad}
          fullWidth
        >
          Leave Plan
        </Button>
      </div>
    </div>
  );
}
