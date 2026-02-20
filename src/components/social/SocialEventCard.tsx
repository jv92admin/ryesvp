'use client';

import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { EventDisplay } from '@/db/events';
import { SmartSquadButton } from '../SmartSquadButton';
import { FriendAvatarStack } from '../ui/FriendAvatarStack';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SocialEventCardProps {
  event: EventDisplay;
  highlighted?: boolean;
  onAvatarClick: (eventId: string) => void;
}

export function SocialEventCard({ event, highlighted = false, onAvatarClick }: SocialEventCardProps) {
  const friendsList = [
    ...(event.social?.friendsGoingList || []),
    ...(event.social?.friendsInterestedList || []),
  ].slice(0, 5);

  return (
    <div className={`px-4 py-3 hover:bg-gray-50 transition-colors ${highlighted ? 'bg-[var(--brand-primary-light)]/50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Image */}
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.displayTitle}
            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/events/${event.id}`} className="hover:text-[var(--brand-primary)]">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
              {event.displayTitle}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')} • {event.venue.name}
          </p>

          {/* Friend avatars + Plan button row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {friendsList.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAvatarClick(event.id);
                  }}
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <FriendAvatarStack
                    friends={friendsList}
                    maxVisible={3}
                    size="sm"
                  />
                </button>
              )}
            </div>

            <SmartSquadButton
              eventId={event.id}
              userSquadId={(event as any).userSquad?.id}
              friendsGoing={event.social?.friendsGoing || 0}
              friendsInterested={event.social?.friendsInterested || 0}
              event={{
                id: event.id,
                title: event.displayTitle,
                startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
                venue: { name: event.venue.name }
              }}
              variant="compact"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
