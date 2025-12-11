'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { PerformerType } from '@prisma/client';

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
  ARTIST: 'bg-purple-100 text-purple-800',
  TEAM: 'bg-blue-100 text-blue-800',
  COMEDIAN: 'bg-amber-100 text-amber-800',
  COMPANY: 'bg-gray-100 text-gray-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Generate consistent color from name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-500',
    'bg-pink-500',
    'bg-fuchsia-500',
    'bg-purple-500',
    'bg-violet-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-green-500',
    'bg-lime-500',
    'bg-amber-500',
    'bg-orange-500',
    'bg-red-500',
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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        ) : performer ? (
          <>
            {/* Header with image or placeholder */}
            <div className="relative bg-gray-100 px-6 pt-6 pb-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>

              <div className="flex items-start gap-4">
                {/* Image or placeholder */}
                {performer.imageUrl ? (
                  <img
                    src={performer.imageUrl}
                    alt={performer.name}
                    className="w-20 h-20 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full ${getAvatarColor(performer.name)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}
                  >
                    {getInitials(performer.name)}
                  </div>
                )}

                {/* Name and type */}
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
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

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Bio */}
              {performer.bio && (
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {performer.bio}
                </p>
              )}

              {/* Tags/Genres */}
              {performer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {performer.tags.slice(0, 5).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Links */}
              {performer.spotifyUrl && (
                <a
                  href={performer.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#1DB954] hover:underline"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Listen on Spotify
                </a>
              )}

              {/* Events Section */}
              {(pastEvent || upcomingEvent) && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {/* Past Event */}
                  {pastEvent && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Last Show
                      </p>
                      <Link
                        href={`/events/${pastEvent.id}`}
                        onClick={onClose}
                        className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pastEvent.displayTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pastEvent.venue.name} •{' '}
                          {formatInTimeZone(
                            new Date(pastEvent.startDateTime),
                            AUSTIN_TIMEZONE,
                            'MMM d, yyyy'
                          )}
                        </p>
                      </Link>
                    </div>
                  )}

                  {/* Upcoming Event */}
                  {upcomingEvent && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Next Show
                      </p>
                      <Link
                        href={`/events/${upcomingEvent.id}`}
                        onClick={onClose}
                        className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {upcomingEvent.displayTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          {upcomingEvent.venue.name} •{' '}
                          {formatInTimeZone(
                            new Date(upcomingEvent.startDateTime),
                            AUSTIN_TIMEZONE,
                            'MMM d, yyyy'
                          )}
                        </p>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* No events state */}
              {!pastEvent && !upcomingEvent && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-400 text-center">
                    First time in Austin!
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

