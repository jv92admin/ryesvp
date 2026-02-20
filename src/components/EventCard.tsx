'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { EventDisplay, EnrichmentDisplay } from '@/db/events';
import { EventCardActions } from './EventCardActions';
import { FriendAvatarStack } from './ui/FriendAvatarStack';
import { CombinedAttendanceModal } from './CombinedAttendanceModal';
import { formatEventDate, isNewListing } from '@/lib/utils';
import { type TMPresale, isRelevantPresale } from '@/lib/presales';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { categoryColors as categoryColorMap, eventStatusConfig, externalBrands } from '@/lib/constants';

// SVG icons for presale states
const PresaleIcons = {
  active: (
    <svg className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  upcoming: (
    <svg className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  onSale: (
    <svg className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  ),
};

// SVG icons for event categories (used as fallback when no image)
const CategoryIcons: Record<string, ReactNode> = {
  CONCERT: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
    </svg>
  ),
  COMEDY: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  THEATER: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
    </svg>
  ),
  MOVIE: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
    </svg>
  ),
  SPORTS: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-2.54.952M14.25 14.25a7.462 7.462 0 01-1.07.07m0 0a7.462 7.462 0 01-1.07-.07" />
    </svg>
  ),
  FESTIVAL: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  OTHER: (
    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
};

// Get presale info for display - returns text and icon for the presale row
function getPresaleInfo(enrichment: EnrichmentDisplay | undefined): {
  icon: ReactNode;
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
        icon: PresaleIcons.active,
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
      icon: PresaleIcons.upcoming,
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
      icon: PresaleIcons.onSale,
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
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const { saveScrollPosition, savePaginationState } = useScrollRestoration();
  
  // Combined save function for both scroll and pagination
  const handleNavigate = () => {
    saveScrollPosition();
    // Pagination state is saved by EventListWithPagination on loadMore
  };
  const social = event.social;
  const enrichment = event.enrichment;
  const isNew = isNewListing(event.createdAt);
  
  const { displayTitle } = event;
  
  // Get presale info
  const presaleInfo = getPresaleInfo(enrichment);
  
  // Calculate friend list for avatars
  const friendsList = [
    ...(social?.friendsGoingList || []),
    ...(social?.friendsInterestedList || []),
  ].slice(0, 5);
  const hasFriends = friendsList.length > 0;
  
  const categoryIcon = CategoryIcons[event.category] || CategoryIcons.OTHER;

  // Status badge for non-scheduled events
  const showStatusBadge = event.status !== 'SCHEDULED';
  const statusConfig = eventStatusConfig[event.status as keyof typeof eventStatusConfig];
  const statusBadgeClass = statusConfig?.colors || '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4">
      {/* Main clickable area - links to event page */}
      <Link href={`/events/${event.id}`} className="block" onClick={handleNavigate}>
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
              {categoryIcon}
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
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--action-primary)] text-[var(--action-primary-text)] rounded">
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
              <p className={`text-xs mt-1.5 truncate flex items-center gap-1 ${presaleInfo.isActive ? 'text-[var(--signal-info)] font-medium' : 'text-gray-500'}`}>
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
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${categoryColorMap[event.category] || 'bg-gray-100 text-gray-800'}`}>
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
              className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: externalBrands.spotify.bg }}
              title="Listen on Spotify"
            >
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
          )}
          
          {/* Friend avatars - clickable to open modal */}
          {hasFriends && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFriendsModal(true);
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
      
      {/* Friends modal */}
      {showFriendsModal && (
        <CombinedAttendanceModal
          eventId={event.id}
          goingCount={social?.friendsGoing || 0}
          interestedCount={social?.friendsInterested || 0}
          onClose={() => setShowFriendsModal(false)}
        />
      )}
    </div>
  );
}
