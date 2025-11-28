/**
 * Ticketmaster Discovery API Client
 * 
 * Handles all communication with the TM API, including rate limiting.
 * API Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

import {
  TMSearchResponse,
  TMEvent,
  TMVenue,
  TMEventSearchParams,
  TMVenueSearchParams,
} from './types';

const TM_API_BASE = 'https://app.ticketmaster.com/discovery/v2';
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '';

// Rate limiting: TM allows 5 requests/second
const MIN_REQUEST_INTERVAL_MS = 250; // ~4 req/sec to be safe
let lastRequestTime = 0;

/**
 * Wait to respect rate limits
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

/**
 * Make a request to the TM API
 */
async function tmFetch<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T | null> {
  if (!TICKETMASTER_API_KEY) {
    console.error('TICKETMASTER_API_KEY is not set');
    return null;
  }

  await rateLimit();

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set('apikey', TICKETMASTER_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, String(value));
    }
  }

  const url = `${TM_API_BASE}${endpoint}?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('TM API: Invalid API key');
      } else if (response.status === 429) {
        console.error('TM API: Rate limit exceeded');
        // Wait a bit and could retry, but for now just fail
      } else {
        console.error(`TM API error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('TM API fetch error:', error);
    return null;
  }
}

// === Event APIs ===

/**
 * Search for events with various filters
 */
export async function searchEvents(
  params: TMEventSearchParams
): Promise<TMEvent[]> {
  const response = await tmFetch<TMSearchResponse<TMEvent>>(
    '/events.json',
    params as Record<string, string | number | undefined>
  );

  return response?._embedded?.events || [];
}

/**
 * Search for events at a specific venue on a specific date
 */
export async function searchEventsAtVenue(
  tmVenueId: string,
  date: Date
): Promise<TMEvent[]> {
  // Format date as local date string (YYYY-MM-DD) for TM's localStartDateTime
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const localDate = `${year}-${month}-${day}`;

  // Use localStartDateTime for accurate local time matching
  // TM expects format: "2024-12-04T00:00:00,2024-12-04T23:59:59"
  const localStartDateTime = `${localDate}T00:00:00,${localDate}T23:59:59`;

  return searchEvents({
    venueId: tmVenueId,
    localStartDateTime,
    size: 50, // Should be plenty for one venue on one day
    sort: 'date,asc',
    includeTBA: 'yes',
    includeTBD: 'yes',
  });
}

/**
 * Search events by keyword in a city
 */
export async function searchEventsByKeyword(
  keyword: string,
  city: string = 'Austin',
  stateCode: string = 'TX'
): Promise<TMEvent[]> {
  return searchEvents({
    keyword,
    city,
    stateCode,
    countryCode: 'US',
    size: 20,
    sort: 'relevance,desc',
  });
}

/**
 * Get a specific event by ID
 */
export async function getEvent(eventId: string): Promise<TMEvent | null> {
  const response = await tmFetch<TMEvent>(`/events/${eventId}.json`);
  return response;
}

// === Venue APIs ===

/**
 * Search for venues
 */
export async function searchVenues(
  params: TMVenueSearchParams
): Promise<TMVenue[]> {
  const response = await tmFetch<TMSearchResponse<TMVenue>>(
    '/venues.json',
    params as Record<string, string | number | undefined>
  );

  return response?._embedded?.venues || [];
}

/**
 * Search for venues in Austin, TX
 */
export async function searchAustinVenues(
  keyword?: string
): Promise<TMVenue[]> {
  return searchVenues({
    city: 'Austin',
    stateCode: 'TX',
    countryCode: 'US',
    keyword,
    size: 50,
    sort: 'relevance,desc',
  });
}

/**
 * Get a specific venue by ID
 */
export async function getVenue(venueId: string): Promise<TMVenue | null> {
  const response = await tmFetch<TMVenue>(`/venues/${venueId}.json`);
  return response;
}

// === Utility Functions ===

/**
 * Get the best image URL from a TM event (prefer 16:9 ratio, high res)
 */
export function getBestImageUrl(event: TMEvent): string | null {
  if (!event.images || event.images.length === 0) return null;

  // Prefer 16:9 ratio, then largest image
  const sorted = [...event.images].sort((a, b) => {
    // Prefer 16:9
    if (a.ratio === '16_9' && b.ratio !== '16_9') return -1;
    if (b.ratio === '16_9' && a.ratio !== '16_9') return 1;
    
    // Then prefer larger
    return (b.width * b.height) - (a.width * a.height);
  });

  return sorted[0]?.url || null;
}

/**
 * Get primary classification from event
 */
export function getPrimaryClassification(event: TMEvent): {
  segment: string | null;
  genre: string | null;
  subGenre: string | null;
} {
  const primary = event.classifications?.find(c => c.primary) || event.classifications?.[0];
  
  return {
    segment: primary?.segment?.name || null,
    genre: primary?.genre?.name || null,
    subGenre: primary?.subGenre?.name || null,
  };
}

/**
 * Get standard price range (not platinum/VIP)
 */
export function getStandardPriceRange(event: TMEvent): {
  min: number | null;
  max: number | null;
  currency: string | null;
} {
  const standardPrices = event.priceRanges?.filter(
    p => p.type === 'standard' || !p.type
  );
  
  if (!standardPrices || standardPrices.length === 0) {
    return { min: null, max: null, currency: null };
  }

  // Get overall min and max across all standard price ranges
  const mins = standardPrices.map(p => p.min).filter((m): m is number => m !== undefined);
  const maxes = standardPrices.map(p => p.max).filter((m): m is number => m !== undefined);

  return {
    min: mins.length > 0 ? Math.min(...mins) : null,
    max: maxes.length > 0 ? Math.max(...maxes) : null,
    currency: standardPrices[0]?.currency || 'USD',
  };
}

/**
 * Get supporting acts from attractions (excluding headliner)
 */
export function getSupportingActs(event: TMEvent): string[] {
  const attractions = event._embedded?.attractions || [];
  
  if (attractions.length <= 1) return [];
  
  // First attraction is typically the headliner, rest are support
  return attractions.slice(1).map(a => a.name);
}

/**
 * Get external links as a simplified object
 */
export function getExternalLinks(event: TMEvent): Record<string, string> {
  const links: Record<string, string> = {};
  
  const externalLinks = event.externalLinks;
  if (!externalLinks) return links;

  // Get first URL from each category
  if (externalLinks.spotify?.[0]?.url) links.spotify = externalLinks.spotify[0].url;
  if (externalLinks.youtube?.[0]?.url) links.youtube = externalLinks.youtube[0].url;
  if (externalLinks.instagram?.[0]?.url) links.instagram = externalLinks.instagram[0].url;
  if (externalLinks.facebook?.[0]?.url) links.facebook = externalLinks.facebook[0].url;
  if (externalLinks.twitter?.[0]?.url) links.twitter = externalLinks.twitter[0].url;
  if (externalLinks.homepage?.[0]?.url) links.homepage = externalLinks.homepage[0].url;
  if (externalLinks.wiki?.[0]?.url) links.wiki = externalLinks.wiki[0].url;

  return links;
}

/**
 * Check if TM API key is configured
 */
export function isConfigured(): boolean {
  return Boolean(TICKETMASTER_API_KEY);
}

