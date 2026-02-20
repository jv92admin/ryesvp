import { EventCategory } from '@prisma/client';

/**
 * Category → color class mapping.
 * Single source of truth — previously duplicated in EventCard.tsx and events/[id]/page.tsx.
 *
 * Text-only micro labels (no background, no pill). Subtle category tint via text color.
 * Inc 3.5: moved from colored pill backgrounds to editorial text-only treatment.
 */
export const categoryColors: Record<EventCategory, string> = {
  CONCERT: 'text-purple-700',
  COMEDY: 'text-amber-700',
  THEATER: 'text-pink-700',
  MOVIE: 'text-red-700',
  SPORTS: 'text-blue-700',
  FESTIVAL: 'text-orange-700',
  OTHER: 'text-[var(--text-secondary)]',
};

/**
 * Category → SVG icon name mapping.
 * Replaces the old categoryEmojis map (🎵🎭🎪 etc.).
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
