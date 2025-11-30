'use client';

import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
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
          <button
            onClick={onSharePlan}
            disabled={copying === 'plan'}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              squad.members.length === 1
                ? 'bg-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-300 ring-offset-1'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50`}
          >
            {copying === 'plan' ? '✓ Copied!' : 'Share Squad'}
          </button>
          <button
            onClick={onShareDayOf}
            disabled={copying === 'dayof' || (!squad.meetTime && !squad.meetSpot)}
            className="flex-1 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title={(!squad.meetTime && !squad.meetSpot) ? 'Set meetup details first' : ''}
          >
            {copying === 'dayof' ? '✓ Copied!' : 'Share Day-of'}
          </button>
        </div>
      </div>

      {/* Leave Squad */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <button
          onClick={onLeaveSquad}
          className="w-full px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Leave Squad
        </button>
      </div>
    </div>
  );
}
