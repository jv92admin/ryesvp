'use client';

type UserStatus = 'GOING' | 'INTERESTED' | 'NEED_TICKETS' | 'HAVE_TICKETS' | null | undefined;

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: string; label: string; colors: string }> = {
  GOING: {
    icon: '✓',
    label: 'Going',
    colors: 'bg-emerald-100 text-emerald-700',
  },
  INTERESTED: {
    icon: '★',
    label: 'Interested',
    colors: 'bg-amber-100 text-amber-700',
  },
  NEED_TICKETS: {
    icon: '🎫',
    label: 'Need Tickets',
    colors: 'bg-blue-100 text-blue-700',
  },
  HAVE_TICKETS: {
    icon: '🎟️',
    label: 'Have Tickets',
    colors: 'bg-purple-100 text-purple-700',
  },
};

/**
 * Shared status badge component for user event status
 * Used in: EventCard, SocialSectionA, SocialSectionB
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null;
  
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${config.colors} ${className}`}>
      {config.icon} {config.label}
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
      <span className={`text-xs font-medium ${highlight ? 'text-[var(--brand-primary)]' : 'text-gray-600'} ${className}`}>
        {text}
      </span>
    );
  }
  
  // Pill variant - matches EventCard style
  const pillColors = isGoing
    ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
    : 'bg-amber-50 text-amber-700';
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${pillColors} ${className}`}>
      {text}
    </span>
  );
}

