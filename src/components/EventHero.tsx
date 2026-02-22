'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AttendanceStatus, EventCategory } from '@prisma/client';
import { PerformerLink } from '@/components/PerformerLink';
import { ShareButton } from '@/components/ShareButton';
import { useEngagementToast } from './EngagementToast';
import { formatInTimeZone } from 'date-fns-tz';
import { isNewListing } from '@/lib/utils';
import { categoryColors, eventStatusConfig } from '@/lib/constants';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface EventHeroProps {
  event: {
    imageUrl: string | null;
    title: string;
    displayTitle: string;
    category: string;
    status: string;
    performer: { id: string; name: string } | null;
    startDateTime: string;
    endDateTime: string | null;
    venue: { name: string; city: string | null; state: string | null };
    createdAt: string;
  };
  supportingActs: string[] | null;
  eventId: string;
  initialStatus: AttendanceStatus | null;
  isLoggedIn: boolean;
  shareProps: {
    title: string;
    venueName: string;
    dateFormatted: string;
    eventUrl: string;
  };
}

export function EventHero({
  event,
  supportingActs,
  eventId,
  initialStatus,
  isLoggedIn,
  shareProps,
}: EventHeroProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, ToastComponent } = useEngagementToast();

  const isNew = isNewListing(new Date(event.createdAt));
  const statusConfig = eventStatusConfig[event.status as keyof typeof eventStatusConfig];

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleAttendance = async (newStatus: 'INTERESTED' | 'GOING') => {
    const previous = status;
    setIsLoading(true);
    setStatus(status === newStatus ? null : newStatus);

    try {
      if (previous === newStatus) {
        await fetch(`/api/events/${eventId}/attendance`, { method: 'DELETE' });
      } else {
        const res = await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) setStatus(previous);
        else if (previous === null) showToast();
      }
    } catch {
      setStatus(previous);
    } finally {
      setIsLoading(false);
    }
  };

  // Attendance toggle styles
  const pill = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50';
  const pillOff = 'border-[var(--border-subtle)] text-[var(--lark-text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]';

  return (
    <>
      {/* Hero Image with Overlays */}
      <div className="relative w-full rounded-xl overflow-hidden mb-4">
        {event.imageUrl ? (
          <div className="aspect-[16/9] max-h-72">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] max-h-48 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--border-subtle)] flex items-center justify-center">
            <span className="text-lg font-medium text-[var(--lark-text-muted)] uppercase tracking-wider">
              {event.category}
            </span>
          </div>
        )}

        {/* Back button — overlay */}
        <button
          onClick={handleBack}
          className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Share button — overlay */}
        <ShareButton
          title={shareProps.title}
          venueName={shareProps.venueName}
          dateFormatted={shareProps.dateFormatted}
          eventUrl={shareProps.eventUrl}
          isLoggedIn={isLoggedIn}
          iconOnly
          className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/50 transition-colors"
        />

        {/* Gradient fade at bottom of image */}
        {event.imageUrl && (
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        )}

        {/* Title + badges overlaid on gradient (only when image exists) */}
        {event.imageUrl && (
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1.5">
              {isNew && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--bg-elevated)] text-[var(--lark-text-primary)] rounded">
                  NEW
                </span>
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                {event.category}
              </span>
              {event.status !== 'SCHEDULED' && statusConfig && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-white/20 text-white">
                  {statusConfig.label}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
              {event.displayTitle}
            </h1>
            {event.performer && (
              <p className="text-sm text-white/80 mt-0.5">
                by {event.performer.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Title + badges below image (only when NO image) */}
      {!event.imageUrl && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            {isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--accent)] text-[var(--text-inverse)] rounded">
                NEW
              </span>
            )}
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${categoryColors[event.category as EventCategory] || 'text-[var(--lark-text-secondary)]'}`}>
              {event.category}
            </span>
            {event.status !== 'SCHEDULED' && statusConfig && (
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${statusConfig.colors}`}>
                {statusConfig.label}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--lark-text-primary)] leading-snug">
            {event.displayTitle}
          </h1>
          {event.performer && (
            <div className="text-sm text-[var(--lark-text-secondary)] mt-1">
              by <PerformerLink performerId={event.performer.id} performerName={event.performer.name} />
            </div>
          )}
        </div>
      )}

      {/* Performer link (when image exists — the overlay only shows plain text) */}
      {event.imageUrl && event.performer && (
        <div className="text-sm text-[var(--lark-text-secondary)] mb-1">
          by <PerformerLink performerId={event.performer.id} performerName={event.performer.name} />
        </div>
      )}

      {/* Supporting acts */}
      {supportingActs && supportingActs.length > 0 && (
        <p className="text-sm text-[var(--lark-text-muted)] mb-2">
          With: {supportingActs.join(', ')}
        </p>
      )}

      {/* Date + Time */}
      <div className="text-sm text-[var(--lark-text-secondary)] mb-1.5">
        <span className="font-medium">
          {formatInTimeZone(new Date(event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d')}
          {' \u00B7 '}
          {formatInTimeZone(new Date(event.startDateTime), AUSTIN_TIMEZONE, 'h:mm a')}
          {event.endDateTime && ` \u2013 ${formatInTimeZone(new Date(event.endDateTime), AUSTIN_TIMEZONE, 'h:mm a')}`}
        </span>
      </div>

      {/* Venue */}
      <div className="flex items-center gap-2 text-sm text-[var(--lark-text-secondary)] mb-4">
        <svg className="w-4 h-4 text-[var(--lark-text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <span className="font-medium">{event.venue.name}</span>
        {event.venue.city && event.venue.state && (
          <span className="text-[var(--lark-text-muted)]">, {event.venue.city}, {event.venue.state}</span>
        )}
      </div>

      {/* Inline attendance toggles */}
      {isLoggedIn && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => handleAttendance('INTERESTED')}
            disabled={isLoading}
            className={`${pill} ${status === 'INTERESTED'
              ? 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] border-[var(--border-visible)]'
              : pillOff
            }`}
          >
            Interested
          </button>
          <button
            onClick={() => handleAttendance('GOING')}
            disabled={isLoading}
            className={`${pill} ${status === 'GOING'
              ? 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)] border-[var(--border-visible)]'
              : pillOff
            }`}
          >
            Going
          </button>
        </div>
      )}

      {!isLoggedIn && (
        <div className="mb-6" />
      )}

      {ToastComponent}
    </>
  );
}
