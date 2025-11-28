/**
 * Venue Mapping: RyesVP Venue Slugs → Ticketmaster Venue IDs
 * 
 * To find TM venue IDs, query:
 * GET https://app.ticketmaster.com/discovery/v2/venues?city=Austin&stateCode=TX&countryCode=US&apikey=YOUR_KEY
 * 
 * These IDs were looked up from the TM API for Austin, TX venues.
 * Update these if venues change or you add new ones.
 */

export interface VenueMapping {
  tmVenueId: string;
  tmVenueName: string; // For reference/logging
  aliases?: string[]; // Alternative TM names for this venue
}

/**
 * Map of RyesVP venue slugs to Ticketmaster venue info.
 * 
 * NOTE: You'll need to populate these TM IDs by querying the TM API.
 * Run the helper script: `npx tsx scripts/lookup-tm-venues.ts`
 */
export const VENUE_TM_MAPPING: Record<string, VenueMapping> = {
  'moody-center': {
    tmVenueId: 'KovZ917ANwG',
    tmVenueName: 'Moody Center ATX',
  },
  'acl-live': {
    tmVenueId: 'KovZpZAJJlvA',
    tmVenueName: 'Austin City Limits Live at The Moody Theater',
  },
  'stubbs': {
    tmVenueId: 'KovZ917AxzU',
    tmVenueName: "Stubb's Waller Creek Amphitheater",
  },
  'paramount-theatre': {
    tmVenueId: 'KovZpZAaa1nA',
    tmVenueName: 'Paramount Theatre',
  },
  'bass-concert-hall': {
    tmVenueId: 'KovZpZAJJ7AA',
    tmVenueName: 'Bass Concert Hall',
  },
  'long-center': {
    tmVenueId: 'KovZpZAJEFvA',
    tmVenueName: 'The Long Center for the Performing Arts',
  },
};

/**
 * Get TM venue ID for a RyesVP venue slug
 */
export function getTMVenueId(venueSlug: string): string | null {
  const mapping = VENUE_TM_MAPPING[venueSlug];
  if (!mapping || !mapping.tmVenueId) {
    return null;
  }
  return mapping.tmVenueId;
}

/**
 * Get all venue slugs that have TM mappings configured
 */
export function getMappedVenueSlugs(): string[] {
  return Object.entries(VENUE_TM_MAPPING)
    .filter(([, mapping]) => mapping.tmVenueId)
    .map(([slug]) => slug);
}

/**
 * Check if a venue has TM mapping configured
 */
export function hasTMMapping(venueSlug: string): boolean {
  const mapping = VENUE_TM_MAPPING[venueSlug];
  return Boolean(mapping?.tmVenueId);
}

// Austin DMA ID for broader searches (if needed)
export const AUSTIN_DMA_ID = '222';

// Austin market ID
export const AUSTIN_MARKET_ID = '40'; // San Antonio & Austin market

