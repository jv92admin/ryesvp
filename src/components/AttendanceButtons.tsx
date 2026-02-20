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
    const disabled = 'px-3 py-2.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] cursor-not-allowed text-sm font-medium';
    return (
      <div>
        <div className="grid grid-cols-2 gap-2">
          <button disabled className={disabled}>Interested</button>
          <button disabled className={disabled}>Going</button>
        </div>
        <p className="text-xs text-[var(--text-muted)] text-center mt-2">
          <Link href="/login" className="text-[var(--action-engage)] hover:underline">Sign in</Link> to mark your status
        </p>
      </div>
    );
  }

  const base = 'px-3 py-2.5 rounded-lg font-medium transition-colors text-sm border disabled:opacity-50 disabled:cursor-not-allowed';
  const inactive = 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:border-[var(--border-strong)]';

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleChange('INTERESTED')}
          disabled={isLoading}
          className={`${base} ${status === 'INTERESTED'
            ? 'bg-[var(--signal-interested-light)] text-[var(--signal-interested)] border-[var(--signal-interested)]'
            : inactive
          }`}
        >
          Interested
        </button>
        <button
          onClick={() => handleChange('GOING')}
          disabled={isLoading}
          className={`${base} ${status === 'GOING'
            ? 'bg-[var(--signal-going-light)] text-[var(--signal-going)] border-[var(--signal-going)]'
            : inactive
          }`}
        >
          Going
        </button>
      </div>
      {ToastComponent}
    </>
  );
}
