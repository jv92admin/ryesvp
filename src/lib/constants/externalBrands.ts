/**
 * External service brand colors.
 * Single source of truth — used in ExploreCard.tsx and event detail page.
 *
 * These are the ONLY place where hex brand colors for third parties live.
 * Components use these constants, never raw hex values.
 */
export const externalBrands = {
  spotify: {
    bg: '#1DB954',
    hover: '#1ed760',
    label: 'Spotify',
  },
  youtube: {
    bg: '#FF0000',
    hover: '#cc0000',
    label: 'YouTube',
  },
  instagram: {
    gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    label: 'Instagram',
  },
  ticketmaster: {
    bg: '#01579B',
    label: 'Ticketmaster',
  },
} as const;
