'use client';

import { statusConfig } from '@/lib/constants';

type UserStatus = 'GOING' | 'INTERESTED' | 'NEED_TICKETS' | 'HAVE_TICKETS' | null | undefined;

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

const STATUS_ICONS: Record<string, string> = {
  GOING: '✓',
  INTERESTED: '★',
  NEED_TICKETS: '🎫',
  HAVE_TICKETS: '🎟️',
};

/**
 * Shared status badge component for user event status
 * Used in: EventCard, SocialSectionA, SocialSectionB
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null;
  
  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${config.colors} ${className}`}>
      {STATUS_ICONS[status] || ''} {config.label}
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
 * Shared friend count badge for showing social signals
 * Used in: EventCard, SocialSectionB
 * 
 * variant="pill" (default): Shows as a colored pill badge
 * variant="text": Shows as plain text (for compact layouts)
 */
export function FriendCountBadge({ 
  goingCount = 0, 
  interestedCount = 0, 
  highlight = false,
  variant = 'pill',
  className = '' 
}: FriendCountBadgeProps) {
  const total = goingCount + interestedCount;
  if (total === 0) return null;
  
  const isGoing = goingCount > 0;
  const text = isGoing
    ? `👥 ${goingCount} going`
    : `👥 ${interestedCount} interested`;
  
  if (variant === 'text') {
    return (
      <span className={`text-xs font-medium ${highlight ? 'text-[var(--signal-going)]' : 'text-gray-600'} ${className}`}>
        {text}
      </span>
    );
  }
  
  // Pill variant - matches EventCard style
  const pillColors = isGoing
    ? 'bg-[var(--signal-going-light)] text-[var(--signal-going)]'
    : 'bg-[var(--signal-interested-light)] text-amber-700';
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${pillColors} ${className}`}>
      {text}
    </span>
  );
}

