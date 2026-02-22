/**
 * Lark user attendance status — monochrome.
 * GOING = accent filled, INTERESTED = outlined, NEED_TICKETS = red, HAVE_TICKETS = accent.
 */
export const statusConfig = {
  GOING: {
    label: 'Going',
    colors: 'bg-[var(--accent)] text-[var(--text-inverse)]',
    dotColor: 'bg-[var(--accent)]',
  },
  INTERESTED: {
    label: 'Interested',
    colors: 'bg-transparent text-[var(--lark-text-secondary)] border border-[var(--border-visible)]',
    dotColor: 'bg-[var(--lark-text-secondary)]',
  },
  NEED_TICKETS: {
    label: 'Need Tickets',
    colors: 'bg-[var(--status-need-ticket)] text-white',
    dotColor: 'bg-[var(--status-need-ticket)]',
  },
  HAVE_TICKETS: {
    label: 'Have Tickets',
    colors: 'bg-[var(--accent)] text-[var(--text-inverse)]',
    dotColor: 'bg-[var(--accent)]',
  },
} as const;

export type UserStatus = keyof typeof statusConfig;

/**
 * Event status → display config. Monochrome.
 */
export const eventStatusConfig = {
  SOLD_OUT: {
    label: 'Sold Out',
    colors: 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)]',
  },
  CANCELLED: {
    label: 'Cancelled',
    colors: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
  },
  POSTPONED: {
    label: 'Postponed',
    colors: 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)]',
  },
} as const;
