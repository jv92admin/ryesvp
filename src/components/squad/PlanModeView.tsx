'use client';

import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui';
import { SquadStatusControls } from './SquadStatusControls';
import { SquadGuestsSection } from './SquadGuestsSection';
import { SquadTicketsSection } from './SquadTicketsSection';
import { SquadPriceGuideCard } from './SquadPriceGuideCard';
import { SquadMemberList } from './SquadMemberList';
import { CalendarDropdown } from '@/components/CalendarDropdown';

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
  calendarPreference?: string | null;
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
  calendarPreference,
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

      {/* Quick Actions - Share & Calendar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onSharePlan}
          disabled={copying === 'plan'}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            copying === 'plan' 
              ? 'text-green-600' 
              : squad.members.length === 1 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-gray-600 hover:text-green-600'
          }`}
        >
          {copying === 'plan' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
          <span>{copying === 'plan' ? 'Copied!' : 'Share'}</span>
        </button>
        <CalendarDropdown
          squad={squad}
          currentPreference={calendarPreference}
        />
      </div>

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
          onRefresh={onSquadRefresh}
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
