import { EventCategory } from '@prisma/client';

/**
 * Lark category colors — ALL monochrome.
 * Category text uses `--lark-text-secondary`. No colored tints.
 * Event imagery is the only color in the UI.
 */
export const categoryColors: Record<EventCategory, string> = {
  CONCERT: 'text-[var(--lark-text-secondary)]',
  COMEDY: 'text-[var(--lark-text-secondary)]',
  THEATER: 'text-[var(--lark-text-secondary)]',
  MOVIE: 'text-[var(--lark-text-secondary)]',
  SPORTS: 'text-[var(--lark-text-secondary)]',
  FESTIVAL: 'text-[var(--lark-text-secondary)]',
  OTHER: 'text-[var(--lark-text-secondary)]',
};

/**
 * Category → SVG icon name mapping.
 * Components render the appropriate SVG based on this key.
 */
export const categoryIcons: Record<EventCategory, string> = {
  CONCERT: 'music',
  COMEDY: 'mic',
  THEATER: 'theater',
  MOVIE: 'film',
  SPORTS: 'trophy',
  FESTIVAL: 'sparkles',
  OTHER: 'calendar',
};
