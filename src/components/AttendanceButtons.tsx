'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { useEngagementToast } from './EngagementToast';
import Link from 'next/link';

interface AttendanceButtonsProps {
  eventId: string;
  initialStatus: AttendanceStatus | null;
  isLoggedIn: boolean;
}

export function AttendanceButtons({ eventId, initialStatus, isLoggedIn }: AttendanceButtonsProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, ToastComponent } = useEngagementToast();

  const handleChange = async (newStatus: 'INTERESTED' | 'GOING') => {
    const previous = status;
    setIsLoading(true);

    // Optimistic update
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
        if (!res.ok) {
          setStatus(previous);
        } else if (previous === null) {
          showToast();
        }
      }
    } catch {
      setStatus(previous);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-2">
          <button disabled className="px-3 py-2.5 border border-[var(--border-default)] rounded-lg text-[var(--text-muted)] cursor-not-allowed text-sm font-medium">
            Interested
          </button>
          <button disabled className="px-3 py-2.5 border border-[var(--border-default)] rounded-lg text-[var(--text-muted)] cursor-not-allowed text-sm font-medium">
            Going
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] text-center mt-2">
          <Link href="/login" className="text-[var(--action-engage)] hover:underline">Sign in</Link> to mark your status
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleChange('INTERESTED')}
          disabled={isLoading}
          className={`
            px-3 py-2.5 rounded-lg font-medium transition-colors text-sm
            ${status === 'INTERESTED'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Interested
        </button>
        <button
          onClick={() => handleChange('GOING')}
          disabled={isLoading}
          className={`
            px-3 py-2.5 rounded-lg font-medium transition-colors text-sm
            ${status === 'GOING'
              ? 'bg-[var(--signal-going)] text-white'
              : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Going
        </button>
      </div>
      {ToastComponent}
    </>
  );
}
