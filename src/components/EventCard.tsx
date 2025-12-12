'use client';

import Link from 'next/link';
import { EventDisplay, EnrichmentDisplay } from '@/db/events';
import { EventCardActions } from './EventCardActions';
import { FriendCountBadge } from './ui/StatusBadge';
import { formatEventDate, isNewListing } from '@/lib/utils';
import { type TMPresale, isRelevantPresale } from '@/lib/presales';

// Get presale info for display - returns text for the presale row
function getPresaleInfo(enrichment: EnrichmentDisplay | undefined): {
  icon: string;
  text: string;
  isActive: boolean;
} | null {
  if (!enrichment) return null;
  
  const now = new Date();
  const presales = enrichment.tmPresales as TMPresale[] | null;
  
  // Filter to only relevant presales (exclude VIP, resale, etc.)
  const relevantPresales = presales?.filter(p => isRelevantPresale(p.name)) || [];
  
  // Check for active presale first
  for (const presale of relevantPresales) {
    if (!presale.startDateTime) continue;
    
    const start = new Date(presale.startDateTime);
    const end = presale.endDateTime ? new Date(presale.endDateTime) : null;
    
    // Active presale
    if (start <= now && (!end || end > now)) {
      const name = presale.name?.replace(/presale$/i, '').trim() || 'Presale';
      return {
        icon: '🔐',
        text: name,
        isActive: true,
      };
    }
  }
  
  // Check for upcoming presale
  const upcomingPresales = relevantPresales
    .filter(p => p.startDateTime && new Date(p.startDateTime) > now)
    .sort((a, b) => new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime());
  
  if (upcomingPresales.length > 0) {
    const next = upcomingPresales[0];
    const dateStr = new Date(next.startDateTime!).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const name = next.name?.replace(/presale$/i, '').trim() || 'Presale';
    return {
      icon: '⚡',
      text: `${name} · ${dateStr}`,
      isActive: false,
    };
  }
  
  // Check for future public on-sale
  if (enrichment.tmOnSaleStart && new Date(enrichment.tmOnSaleStart) > now) {
    const dateStr = new Date(enrichment.tmOnSaleStart).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      icon: '🎫',
      text: `On sale ${dateStr}`,
      isActive: false,
    };
  }
  
  return null;
}

interface EventCardProps {
  event: EventDisplay;
}

export function EventCard({ event }: EventCardProps) {
  const social = event.social;
  const enrichment = event.enrichment;
  const isNew = isNewListing(event.createdAt);
  
  const { displayTitle } = event;
  
  // Get presale info
  const presaleInfo = getPresaleInfo(enrichment);
  
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

  // Status badge for non-scheduled events
  const showStatusBadge = event.status !== 'SCHEDULED';
  const statusBadgeClasses: Record<string, string> = {
    SOLD_OUT: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800 line-through',
    POSTPONED: 'bg-yellow-100 text-yellow-800',
  };
  const statusBadgeClass = statusBadgeClasses[event.status] || '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4">
      {/* Main clickable area - links to event page */}
      <Link href={`/events/${event.id}`} className="block">
        <div className="flex gap-3">
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
            {/* Row 1: Title + NEW badge */}
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug flex-1 min-w-0">
                {displayTitle}
              </h3>
              {isNew && (
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500 text-white rounded">
                  NEW
                </span>
              )}
            </div>
            
            {/* Row 2: Venue + Date */}
            <p className="text-sm text-gray-500 mt-1 truncate">
              {event.venue.name} • {formatEventDate(event.startDateTime)}
            </p>
            
            {/* Row 3: Presale row (only if present) - plain text, truncated */}
            {presaleInfo && (
              <p className={`text-xs mt-1.5 truncate ${presaleInfo.isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {presaleInfo.icon} {presaleInfo.text}
              </p>
            )}
          </div>
        </div>
      </Link>
      
      {/* Row 4: Meta tags + Social + Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Left side: Category + Spotify + Status + Social */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/* Category badge */}
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${categoryColors[event.category]}`}>
            {event.category}
          </span>
          
          {/* Status badge (Sold Out, Cancelled, etc.) */}
          {showStatusBadge && (
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${statusBadgeClass}`}>
              {event.status.replace('_', ' ')}
            </span>
          )}
          
          {/* Spotify icon */}
          {enrichment?.spotifyUrl && (
            <a 
              href={enrichment.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-colors"
              title="Listen on Spotify"
            >
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
          )}
          
          {/* Friend count */}
          <FriendCountBadge 
            goingCount={social?.friendsGoing} 
            interestedCount={social?.friendsInterested}
          />
          
          {/* Community attendance */}
          {social?.communitiesGoing.slice(0, 1).map((c) => (
            <span 
              key={c.communityId}
              className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
            >
              {c.count} from {c.communityName}
            </span>
          ))}
        </div>
        
        {/* Right side: Going/Interested + Plan button */}
        <div className="flex-shrink-0">
          <EventCardActions
            eventId={event.id}
            userStatus={social?.userStatus}
            userSquadId={event.userSquad?.id}
            friendsGoing={social?.friendsGoing || 0}
            friendsInterested={social?.friendsInterested || 0}
            event={{
              id: event.id,
              title: displayTitle,
              startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
              venue: { name: event.venue.name }
            }}
          />
        </div>
      </div>
    </div>
  );
}
