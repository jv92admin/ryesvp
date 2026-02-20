/**
 * User attendance status → display config.
 * Single source of truth — previously duplicated in StatusBadge.tsx and 6+ squad components.
 *
 * Uses signal tokens from globals.css for state colors.
 */
export const statusConfig = {
  GOING: {
    label: 'Going',
    colors: 'bg-[var(--signal-going-light)] text-[var(--signal-going)]',
    dotColor: 'bg-[var(--signal-going)]',
  },
  INTERESTED: {
    label: 'Interested',
    colors: 'bg-[var(--signal-interested-light)] text-amber-700',
    dotColor: 'bg-[var(--signal-interested)]',
  },
  NEED_TICKETS: {
    label: 'Need Tickets',
    colors: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-[var(--signal-info)]',
  },
  HAVE_TICKETS: {
    label: 'Selling Tickets',
    colors: 'bg-purple-100 text-purple-700',
    dotColor: 'bg-purple-500',
  },
  // NOT_GOING intentionally excluded — users who decline don't show a visible badge.
  // Components using statusConfig should guard with: if (!config) return null
} as const;

export type UserStatus = keyof typeof statusConfig;

/**
 * Event status → display config.
 * For event-level statuses (SOLD_OUT, CANCELLED, POSTPONED).
 */
export const eventStatusConfig = {
  SOLD_OUT: {
    label: 'Sold Out',
    colors: 'bg-[var(--surface-inset)] text-[var(--text-primary)]',
  },
  CANCELLED: {
    label: 'Cancelled',
    colors: 'bg-[var(--surface-inset)] text-[var(--text-secondary)]',
  },
  POSTPONED: {
    label: 'Postponed',
    colors: 'bg-[var(--surface-inset)] text-[var(--text-primary)]',
  },
} as const;
