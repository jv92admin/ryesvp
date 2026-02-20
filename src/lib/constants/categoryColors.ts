import { EventCategory } from '@prisma/client';

/**
 * Category → color class mapping.
 * Single source of truth — previously duplicated in EventCard.tsx and events/[id]/page.tsx.
 *
 * Uses Tailwind utility classes for background + text color.
 * These are semantic (category identification), not brand colors.
 */
export const categoryColors: Record<EventCategory, string> = {
  CONCERT: 'bg-purple-100 text-purple-800',
  COMEDY: 'bg-yellow-100 text-yellow-800',
  THEATER: 'bg-pink-100 text-pink-800',
  MOVIE: 'bg-red-100 text-red-800',
  SPORTS: 'bg-blue-100 text-blue-800',
  FESTIVAL: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-800',
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
