'use client';

import Link from 'next/link';
import { EventDisplay } from '@/db/events';
import { SmartSquadButton } from './SmartSquadButton';
import { StatusBadge, FriendCountBadge } from './ui/StatusBadge';
import { formatEventDate, isNewListing } from '@/lib/utils';

interface EventCardProps {
  event: EventDisplay;
}

export function EventCard({ event }: EventCardProps) {
  const social = event.social;
  const enrichment = event.enrichment;
  const isNew = isNewListing(event.createdAt);
  
  // displayTitle is already computed at the data layer - use directly
  const { displayTitle } = event;
  
  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-violet-100 text-violet-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    MOVIE: 'bg-red-100 text-red-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  const categoryEmojis: Record<string, string> = {
    CONCERT: '🎵',
    COMEDY: '😂',
    THEATER: '🎭',
    MOVIE: '🎬',
    SPORTS: '🏆',
    FESTIVAL: '🎪',
    OTHER: '📅',
  };

  const statusBadge = event.status !== 'SCHEDULED' && (
    <span className={`
      px-2 py-0.5 text-xs font-medium rounded
      ${event.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' : ''}
      ${event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 line-through' : ''}
      ${event.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' : ''}
    `}>
      {event.status.replace('_', ' ')}
    </span>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4">
      {/* Main clickable area - links to event page */}
      <Link href={`/events/${event.id}`} className="flex gap-3">
        {/* Event Image */}
        {event.imageUrl ? (
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl">{categoryEmojis[event.category] || '📅'}</span>
          </div>
        )}
        
        {/* Event Content */}
        <div className="flex-1 min-w-0">
          {/* Title + Category on same line */}
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug flex-1 min-w-0">
              {displayTitle}
            </h3>
            {/* Badges - right side of title */}
            <div className="flex-shrink-0 flex items-center gap-1">
              {isNew && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500 text-white rounded">
                  NEW
                </span>
              )}
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${categoryColors[event.category]}`}>
                {event.category}
              </span>
              {statusBadge}
            </div>
          </div>
          
          {/* Venue + Date on one line */}
          <p className="text-sm text-gray-500 mt-1 truncate">
            {event.venue.name} • {formatEventDate(event.startDateTime)}
          </p>
        </div>
      </Link>
      
      {/* Bottom row: Social signals + Actions - only show if there's content */}
      {(social?.userStatus || 
        (social?.friendsGoing && social.friendsGoing > 0) || 
        (social?.friendsInterested && social.friendsInterested > 0) || 
        (social?.communitiesGoing && social.communitiesGoing.length > 0) ||
        enrichment?.spotifyUrl ||
        event.userSquad?.id
      ) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          {/* Social Signals - left side */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            <StatusBadge status={social?.userStatus} />
            <FriendCountBadge 
              goingCount={social?.friendsGoing} 
              interestedCount={social?.friendsInterested}
            />
            {social?.communitiesGoing.slice(0, 1).map((c) => (
              <span 
                key={c.communityId}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
              >
                {c.count} from {c.communityName}
              </span>
            ))}
          </div>
          
          {/* Actions - right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Spotify icon */}
            {enrichment?.spotifyUrl && (
              <a 
                href={enrichment.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-colors"
                title="Listen on Spotify"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            )}
            
            {/* Go Together button */}
            <SmartSquadButton
              eventId={event.id}
              userSquadId={event.userSquad?.id}
              friendsGoing={social?.friendsGoing || 0}
              friendsInterested={social?.friendsInterested || 0}
              event={{
                id: event.id,
                title: displayTitle,
                startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
                venue: { name: event.venue.name }
              }}
              variant="compact"
            />
          </div>
        </div>
      )}
    </div>
  );
}

