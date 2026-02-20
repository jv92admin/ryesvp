'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { useEngagementToast } from './EngagementToast';
import Link from 'next/link';

interface EventActionBarProps {
  eventId: string;
  initialStatus: AttendanceStatus | null;
  isLoggedIn: boolean;
  buyUrl?: string | null;
}

export function EventActionBar({ eventId, initialStatus, isLoggedIn, buyUrl }: EventActionBarProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, ToastComponent } = useEngagementToast();

  const handleChange = async (newStatus: 'INTERESTED' | 'GOING') => {
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

  // Nothing to show if logged out with no buy link
  if (!isLoggedIn && !buyUrl) return null;

  const toggle = 'px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50';
  const toggleOff = 'border-[var(--border-default)] text-[var(--text-secondary)] bg-white hover:bg-[var(--surface-inset)]';

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[var(--border-default)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          {isLoggedIn && (
            <>
              <button
                onClick={() => handleChange('INTERESTED')}
                disabled={isLoading}
                className={`${toggle} ${status === 'INTERESTED'
                  ? 'bg-[var(--signal-interested-light)] text-[var(--signal-interested)] border-[var(--signal-interested)]'
                  : toggleOff
                }`}
              >
                Interested
              </button>
              <button
                onClick={() => handleChange('GOING')}
                disabled={isLoading}
                className={`${toggle} ${status === 'GOING'
                  ? 'bg-[var(--signal-going-light)] text-[var(--signal-going)] border-[var(--signal-going)]'
                  : toggleOff
                }`}
              >
                Going
              </button>
            </>
          )}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="px-3 py-2 rounded-lg text-xs font-medium text-[var(--action-engage)] border border-[var(--action-engage)] hover:bg-[var(--action-engage-light)] transition-colors"
            >
              Sign In
            </Link>
          )}
          {buyUrl && (
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--action-primary)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] transition-colors"
            >
              Buy Tickets
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      </div>
      {ToastComponent}
    </>
  );
}
