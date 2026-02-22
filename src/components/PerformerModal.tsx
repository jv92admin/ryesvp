'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { PerformerType } from '@prisma/client';
import { Dialog, DialogBody } from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/IconButton';
import { externalBrands } from '@/lib/constants';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface PerformerData {
  id: string;
  name: string;
  slug: string;
  type: PerformerType;
  bio: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  tags: string[];
  spotifyUrl: string | null;
}

interface EventData {
  id: string;
  title: string;
  displayTitle: string;
  startDateTime: string;
  venue: {
    name: string;
    slug: string;
  };
}

interface PerformerModalProps {
  performerId: string;
  onClose: () => void;
}

const TYPE_LABELS: Record<PerformerType, string> = {
  ARTIST: 'Artist',
  TEAM: 'Team',
  COMEDIAN: 'Comedian',
  COMPANY: 'Company',
  OTHER: 'Performer',
};

const TYPE_COLORS: Record<PerformerType, string> = {
  ARTIST: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
  TEAM: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
  COMEDIAN: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
  COMPANY: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
  OTHER: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-lime-500',
    'bg-amber-500', 'bg-orange-500', 'bg-red-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function PerformerModal({ performerId, onClose }: PerformerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performer, setPerformer] = useState<PerformerData | null>(null);
  const [pastEvent, setPastEvent] = useState<EventData | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<EventData | null>(null);

  useEffect(() => {
    async function fetchPerformer() {
      try {
        const res = await fetch(`/api/performers/${performerId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Performer not found');
          } else {
            throw new Error('Failed to fetch');
          }
          return;
        }
        const data = await res.json();
        setPerformer(data.performer);
        setPastEvent(data.pastEvent);
        setUpcomingEvent(data.upcomingEvent);
      } catch (err) {
        setError('Could not load performer');
      } finally {
        setLoading(false);
      }
    }
    fetchPerformer();
  }, [performerId]);

  return (
    <Dialog open={true} onOpenChange={() => onClose()} size="md">
      {loading ? (
        <div className="p-8 text-center text-[var(--lark-text-muted)]">Loading...</div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-[var(--status-need-ticket)] mb-4">{error}</p>
          <button
            onClick={onClose}
            className="text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]"
          >
            Close
          </button>
        </div>
      ) : performer ? (
        <>
          {/* Header with image or placeholder */}
          <div className="relative bg-[var(--bg-surface)] px-6 pt-6 pb-4 flex-shrink-0">
            <div className="absolute top-3 right-3">
              <IconButton
                icon={
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
                label="Close"
                variant="ghost"
                size="sm"
                onClick={onClose}
              />
            </div>

            <div className="flex items-start gap-4">
              {performer.imageUrl ? (
                <img
                  src={performer.imageUrl}
                  alt={performer.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-20 h-20 rounded-full ${getAvatarColor(performer.name)} flex items-center justify-center text-white text-2xl font-bold`}
                >
                  {getInitials(performer.name)}
                </div>
              )}

              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold text-[var(--lark-text-primary)] truncate">
                  {performer.name}
                </h2>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${TYPE_COLORS[performer.type]}`}
                >
                  {TYPE_LABELS[performer.type]}
                </span>
              </div>
            </div>
          </div>

          <DialogBody>
            <div className="space-y-4">
              {performer.bio && (
                <p className="text-[var(--lark-text-secondary)] text-sm leading-relaxed line-clamp-3">
                  {performer.bio}
                </p>
              )}

              {performer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {performer.tags.slice(0, 5).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {performer.spotifyUrl && (
                <a
                  href={performer.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:underline"
                  style={{ color: externalBrands.spotify.bg }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Listen on Spotify
                </a>
              )}

              {(pastEvent || upcomingEvent) && (
                <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
                  {pastEvent && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--lark-text-muted)] uppercase tracking-wider mb-1">
                        Last Show
                      </p>
                      <Link
                        href={`/events/${pastEvent.id}`}
                        onClick={onClose}
                        className="block hover:bg-[var(--bg-surface)] -mx-2 px-2 py-1 rounded transition-colors"
                      >
                        <p className="text-sm font-medium text-[var(--lark-text-primary)] truncate">
                          {pastEvent.displayTitle}
                        </p>
                        <p className="text-xs text-[var(--lark-text-muted)]">
                          {pastEvent.venue.name} •{' '}
                          {formatInTimeZone(new Date(pastEvent.startDateTime), AUSTIN_TIMEZONE, 'MMM d, yyyy')}
                        </p>
                      </Link>
                    </div>
                  )}

                  {upcomingEvent && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--lark-text-muted)] uppercase tracking-wider mb-1">
                        Next Show
                      </p>
                      <Link
                        href={`/events/${upcomingEvent.id}`}
                        onClick={onClose}
                        className="block hover:bg-[var(--bg-surface)] -mx-2 px-2 py-1 rounded transition-colors"
                      >
                        <p className="text-sm font-medium text-[var(--lark-text-primary)] truncate">
                          {upcomingEvent.displayTitle}
                        </p>
                        <p className="text-xs text-[var(--lark-text-muted)]">
                          {upcomingEvent.venue.name} •{' '}
                          {formatInTimeZone(new Date(upcomingEvent.startDateTime), AUSTIN_TIMEZONE, 'MMM d, yyyy')}
                        </p>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {!pastEvent && !upcomingEvent && (
                <div className="border-t border-[var(--border-subtle)] pt-4">
                  <p className="text-sm text-[var(--lark-text-muted)] text-center">
                    First time in Austin!
                  </p>
                </div>
              )}
            </div>
          </DialogBody>
        </>
      ) : null}
    </Dialog>
  );
}
