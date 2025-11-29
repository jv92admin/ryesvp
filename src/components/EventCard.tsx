'use client';

import Link from 'next/link';
import { EventDisplay } from '@/db/events';
import { SmartSquadButton } from './SmartSquadButton';
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
    CONCERT: 'bg-purple-100 text-purple-800',
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

  const hasEnrichmentLinks = enrichment && (enrichment.spotifyUrl || enrichment.wikipediaUrl);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4">
      <div className="flex gap-4">
        {/* Main clickable area - links to event page */}
        <Link href={`/events/${event.id}`} className="flex gap-4 flex-1 min-w-0">
          {/* Event Image */}
          {event.imageUrl ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-3xl">{categoryEmojis[event.category] || '📅'}</span>
            </div>
          )}
          
          {/* Event Content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {isNew && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                  NEW
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
                {event.category}
              </span>
              {statusBadge}
            </div>
            
            {/* Title */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">
              {displayTitle}
            </h3>
            
            {/* Venue */}
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <span className="text-gray-400">📍</span>
              {event.venue.name}
            </p>
            
            {/* Date */}
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <span className="text-gray-400">📅</span>
              {formatEventDate(event.startDateTime)}
            </p>
            
            {/* Social Signals (user status, friends, communities) */}
            {social && (social.userStatus || social.friendsGoing > 0 || social.friendsInterested > 0 || social.communitiesGoing.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* User's own status */}
                {social.userStatus && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    social.userStatus === 'GOING' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {social.userStatus === 'GOING' ? '✓ You\'re going' : '★ You\'re interested'}
                  </span>
                )}
                {social.friendsGoing > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    👥 {social.friendsGoing} friend{social.friendsGoing !== 1 ? 's' : ''} going
                  </span>
                )}
                {social.friendsInterested > 0 && !social.friendsGoing && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                    👥 {social.friendsInterested} interested
                  </span>
                )}
                {social.communitiesGoing.slice(0, 2).map((c) => (
                  <span 
                    key={c.communityId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full"
                  >
                    🎭 {c.count} from {c.communityName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
        
        {/* Smart Squad Button */}
        <div className="flex-shrink-0 flex items-center justify-center px-3">
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
        
        {/* Right side: Enrichment icons - separate from main link */}
        {hasEnrichmentLinks && (
          <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
            {enrichment.spotifyUrl && (
              <a 
                href={enrichment.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-colors"
                title="Listen on Spotify"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            )}
            {enrichment.wikipediaUrl && (
              <a 
                href={enrichment.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Wikipedia"
              >
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801-.3-.852l-.36-.043c-.15-.01-.225-.06-.225-.149v-.44l.06-.05s3.397-.012 4.353.012l.051.045v.446c0 .119-.075.176-.225.176-.549.024-.882.086-1.09.27-.207.186-.356.47-.559.872l-2.391 4.802-.037.178L16.878 19.1c.296.58.801.691 1.094.691.293 0 .53-.099.53-.099.233-.09.372-.224.495-.39.123-.166 3.962-7.759 4.322-8.51.342-.711.498-1.159.498-1.378 0-.283-.205-.424-.603-.456l-.467-.034c-.15-.009-.225-.06-.225-.149v-.44l.06-.05s2.415.016 3.473 0l.037.045v.451c0 .105-.076.15-.227.15-.837.047-1.285.234-1.584.745-.299.51-4.153 7.988-4.549 8.771-.396.783-.846 1.462-1.354 2.037-.506.571-1.097.924-1.59 1.033-.492.105-.898.035-1.141-.18-.243-.218-.396-.543-.458-.985z"/>
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

