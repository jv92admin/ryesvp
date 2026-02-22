'use client';

import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { EventDisplay, EnrichmentDisplay } from '@/db/events';
import { EventCardActions } from './EventCardActions';
import { FriendAvatarStack } from './ui/FriendAvatarStack';
import { CombinedAttendanceModal } from './CombinedAttendanceModal';
import { formatEventDate, isNewListing } from '@/lib/utils';
import { type TMPresale, isRelevantPresale } from '@/lib/presales';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { categoryColors as categoryColorMap, eventStatusConfig, externalBrands } from '@/lib/constants';

// Presale display logic (shared with EventCard)
function getPresaleInfo(enrichment: EnrichmentDisplay | undefined): {
  icon: ReactNode;
  text: string;
  isActive: boolean;
} | null {
  if (!enrichment) return null;

  const now = new Date();
  const presales = enrichment.tmPresales as TMPresale[] | null;
  const relevantPresales = presales?.filter(p => isRelevantPresale(p.name)) || [];

  for (const presale of relevantPresales) {
    if (!presale.startDateTime) continue;
    const start = new Date(presale.startDateTime);
    const end = presale.endDateTime ? new Date(presale.endDateTime) : null;
    if (start <= now && (!end || end > now)) {
      const name = presale.name?.replace(/presale$/i, '').trim() || 'Presale';
      return {
        icon: (
          <svg className="w-3.5 h-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ),
        text: name,
        isActive: true,
      };
    }
  }

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
      icon: (
        <svg className="w-3.5 h-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      text: `${name} · ${dateStr}`,
      isActive: false,
    };
  }

  if (enrichment.tmOnSaleStart && new Date(enrichment.tmOnSaleStart) > now) {
    const dateStr = new Date(enrichment.tmOnSaleStart).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      icon: (
        <svg className="w-3.5 h-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
      ),
      text: `On sale ${dateStr}`,
      isActive: false,
    };
  }

  return null;
}

interface FeaturedEventCardProps {
  event: EventDisplay;
}

/**
 * Featured variant of EventCard — full-width hero image with title below.
 * Used for the first event in each day section to create visual hierarchy.
 */
export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const { saveScrollPosition } = useScrollRestoration();

  const handleNavigate = () => {
    saveScrollPosition();
  };

  const social = event.social;
  const enrichment = event.enrichment;
  const isNew = isNewListing(event.createdAt);
  const { displayTitle } = event;
  const presaleInfo = getPresaleInfo(enrichment);

  const friendsList = [
    ...(social?.friendsGoingList || []),
    ...(social?.friendsInterestedList || []),
  ].slice(0, 5);
  const hasFriends = friendsList.length > 0;

  const showStatusBadge = event.status !== 'SCHEDULED';
  const statusConfig = eventStatusConfig[event.status as keyof typeof eventStatusConfig];
  const statusBadgeClass = statusConfig?.colors || '';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="bg-[var(--bg-elevated)] rounded-[var(--card-radius)] border border-[var(--border-subtle)] overflow-hidden transition-colors hover:border-[var(--border-visible)]"
    >
      {/* Hero Image — full width */}
      <Link href={`/events/${event.id}`} className="block" onClick={handleNavigate}>
        {event.imageUrl ? (
          <div className="relative aspect-[2/1] w-full bg-[var(--bg-surface)]">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[var(--bg-elevated)] to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="aspect-[3/1] w-full bg-[var(--bg-surface)] flex items-center justify-center">
            <span className="text-sm font-medium text-[var(--lark-text-muted)] uppercase tracking-wider">
              {event.category}
            </span>
          </div>
        )}
      </Link>

      {/* Content below image */}
      <div className="px-4 pb-4 -mt-1">
        <Link href={`/events/${event.id}`} className="block" onClick={handleNavigate}>
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${categoryColorMap[event.category] || 'text-[var(--lark-text-secondary)]'}`}>
              {event.category}
            </span>
            {isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--accent)] text-[var(--text-inverse)] rounded">
                NEW
              </span>
            )}
            {showStatusBadge && (
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${statusBadgeClass}`}>
                {event.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-lg font-semibold text-[var(--lark-text-primary)] leading-snug line-clamp-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayTitle}
          </h3>

          {/* Venue + Date */}
          <p className="text-sm text-[var(--lark-text-secondary)] mt-1">
            {event.venue.name} · {formatEventDate(event.startDateTime)}
          </p>

          {/* Presale */}
          {presaleInfo && (
            <p className={`text-xs mt-1.5 flex items-center gap-1 ${presaleInfo.isActive ? 'text-[var(--lark-text-primary)] font-medium' : 'text-[var(--lark-text-secondary)]'}`}>
              {presaleInfo.icon} {presaleInfo.text}
            </p>
          )}
        </Link>

        {/* Social + Actions row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Spotify */}
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
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </a>
            )}

            {/* Friend avatars */}
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
                  maxVisible={4}
                  size="sm"
                />
              </button>
            )}

            {/* Community attendance */}
            {social?.communitiesGoing.slice(0, 1).map((c) => (
              <span
                key={c.communityId}
                className="inline-flex items-center px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--lark-text-primary)] text-xs font-medium rounded-full"
              >
                {c.count} from {c.communityName}
              </span>
            ))}
          </div>

          {/* Actions */}
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

      {/* Friends modal */}
      {showFriendsModal && (
        <CombinedAttendanceModal
          eventId={event.id}
          goingCount={social?.friendsGoing || 0}
          interestedCount={social?.friendsInterested || 0}
          onClose={() => setShowFriendsModal(false)}
        />
      )}
    </motion.div>
  );
}
