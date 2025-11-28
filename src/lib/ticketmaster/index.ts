/**
 * Ticketmaster Integration
 * 
 * Provides event enrichment from the Ticketmaster Discovery API.
 * Used to add pricing, images, presale info, and buy links to existing events.
 */

// Client exports
export {
  searchEvents,
  searchEventsAtVenue,
  searchEventsByKeyword,
  getEvent,
  searchVenues,
  searchAustinVenues,
  getVenue,
  getBestImageUrl,
  getPrimaryClassification,
  getStandardPriceRange,
  getSupportingActs,
  getExternalLinks,
  isConfigured,
} from './client';

// Matcher exports
export {
  findTMMatch,
  extractTMEnrichmentData,
  matchAndExtractTMData,
  calculateSimilarity,
} from './matcher';

// Venue mapping exports
export {
  VENUE_TM_MAPPING,
  getTMVenueId,
  getMappedVenueSlugs,
  hasTMMapping,
  AUSTIN_DMA_ID,
  AUSTIN_MARKET_ID,
} from './venues';

// Types
export type {
  TMEvent,
  TMVenue,
  TMAttraction,
  TMImage,
  TMPresale,
  TMPriceRange,
  TMClassification,
  TMEventSearchParams,
  TMVenueSearchParams,
  TMEventMatch,
  TMEnrichmentData,
} from './types';

