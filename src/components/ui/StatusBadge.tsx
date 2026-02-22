'use client';

import { statusConfig } from '@/lib/constants';

type UserStatus = 'GOING' | 'INTERESTED' | 'NEED_TICKETS' | 'HAVE_TICKETS' | null | undefined;

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

/**
 * Lark user status badge — monochrome except Need Tickets (red).
 * GOING = accent filled, INTERESTED = outlined, NEED_TICKETS = red, HAVE_TICKETS = accent
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null;

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${config.colors} ${className}`}>
      {config.label}
    </span>
  );
}

interface FriendCountBadgeProps {
  goingCount?: number;
  interestedCount?: number;
  highlight?: boolean;
  variant?: 'text' | 'pill';
  className?: string;
}

/**
 * Lark friend count badge — monochrome. No colored pills.
 */
export function FriendCountBadge({
  goingCount = 0,
  interestedCount = 0,
  highlight = false,
  variant = 'pill',
  className = '',
}: FriendCountBadgeProps) {
  const total = goingCount + interestedCount;
  if (total === 0) return null;

  const isGoing = goingCount > 0;
  const text = isGoing
    ? `${goingCount} going`
    : `${interestedCount} interested`;

  if (variant === 'text') {
    return (
      <span className={`text-xs font-medium ${highlight ? 'text-[var(--lark-text-primary)]' : 'text-[var(--lark-text-secondary)]'} ${className}`}>
        {text}
      </span>
    );
  }

  // Pill variant — monochrome
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] ${className}`}>
      {text}
    </span>
  );
}
