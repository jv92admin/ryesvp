/**
 * Ticketmaster Discovery API Types
 * 
 * Based on: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

// === API Response Types ===

export interface TMSearchResponse<T> {
  _embedded?: {
    events?: T[];
    venues?: T[];
    attractions?: T[];
  };
  _links?: {
    self?: { href: string };
    next?: { href: string };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface TMEvent {
  id: string;
  name: string;
  type: 'event';
  url?: string;
  locale?: string;
  description?: string;
  additionalInfo?: string;
  info?: string;
  pleaseNote?: string;

  // Images
  images?: TMImage[];

  // Dates
  dates?: {
    start?: {
      localDate?: string; // "2024-12-15"
      localTime?: string; // "19:30:00"
      dateTime?: string; // ISO 8601
      dateTBD?: boolean;
      dateTBA?: boolean;
      timeTBA?: boolean;
      noSpecificTime?: boolean;
    };
    end?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
    timezone?: string;
    status?: {
      code?: 'onsale' | 'offsale' | 'cancelled' | 'postponed' | 'rescheduled';
    };
    spanMultipleDays?: boolean;
  };

  // Sales info (tickets)
  sales?: {
    public?: {
      startDateTime?: string;
      endDateTime?: string;
      startTBD?: boolean;
      startTBA?: boolean;
    };
    presales?: TMPresale[];
  };

  // Price ranges
  priceRanges?: TMPriceRange[];

  // Classifications (genre, segment, etc.)
  classifications?: TMClassification[];

  // Venues
  _embedded?: {
    venues?: TMVenue[];
    attractions?: TMAttraction[];
  };

  // External links
  externalLinks?: {
    youtube?: { url: string }[];
    twitter?: { url: string }[];
    itunes?: { url: string }[];
    lastfm?: { url: string }[];
    wiki?: { url: string }[];
    facebook?: { url: string }[];
    spotify?: { url: string }[];
    musicbrainz?: { id: string }[];
    instagram?: { url: string }[];
    homepage?: { url: string }[];
  };

  // Seatmap
  seatmap?: {
    staticUrl?: string;
  };

  // Accessibility
  accessibility?: {
    ticketLimit?: number;
    info?: string;
  };

  // Promoter
  promoter?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface TMImage {
  ratio?: '16_9' | '3_2' | '4_3' | '1_1';
  url: string;
  width: number;
  height: number;
  fallback?: boolean;
  attribution?: string;
}

export interface TMPresale {
  name?: string;
  description?: string;
  url?: string;
  startDateTime?: string;
  endDateTime?: string;
}

export interface TMPriceRange {
  type?: 'standard' | 'platinum';
  currency?: string;
  min?: number;
  max?: number;
}

export interface TMClassification {
  primary?: boolean;
  segment?: TMClassificationLevel;
  genre?: TMClassificationLevel;
  subGenre?: TMClassificationLevel;
  type?: TMClassificationLevel;
  subType?: TMClassificationLevel;
  family?: boolean;
}

export interface TMClassificationLevel {
  id: string;
  name: string;
}

export interface TMVenue {
  id: string;
  name: string;
  type: 'venue';
  url?: string;
  locale?: string;
  timezone?: string;
  
  address?: {
    line1?: string;
    line2?: string;
    line3?: string;
  };
  
  city?: {
    name: string;
  };
  
  state?: {
    name?: string;
    stateCode?: string;
  };
  
  country?: {
    name?: string;
    countryCode?: string;
  };
  
  postalCode?: string;
  
  location?: {
    longitude?: string;
    latitude?: string;
  };
  
  images?: TMImage[];
  
  upcomingEvents?: {
    _total?: number;
    ticketmaster?: number;
  };
}

export interface TMAttraction {
  id: string;
  name: string;
  type: 'attraction';
  url?: string;
  locale?: string;
  
  images?: TMImage[];
  
  classifications?: TMClassification[];
  
  externalLinks?: {
    youtube?: { url: string }[];
    twitter?: { url: string }[];
    itunes?: { url: string }[];
    lastfm?: { url: string }[];
    wiki?: { url: string }[];
    facebook?: { url: string }[];
    spotify?: { url: string }[];
    musicbrainz?: { id: string }[];
    instagram?: { url: string }[];
    homepage?: { url: string }[];
  };
  
  upcomingEvents?: {
    _total?: number;
    ticketmaster?: number;
  };
}

// === Query Parameter Types ===

export interface TMEventSearchParams {
  // Location
  venueId?: string;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  postalCode?: string;
  latlong?: string;
  radius?: string;
  unit?: 'miles' | 'km';
  geoPoint?: string;
  dmaId?: string;
  marketId?: string;

  // Date/Time
  startDateTime?: string; // ISO 8601: "2024-12-01T00:00:00Z"
  endDateTime?: string;
  localStartDateTime?: string;
  localStartEndDateTime?: string;

  // Filtering
  keyword?: string;
  attractionId?: string;
  classificationName?: string;
  classificationId?: string;
  segmentId?: string;
  segmentName?: string;
  genreId?: string;
  subGenreId?: string;

  // Pagination
  size?: number; // default 20, max 200
  page?: number;
  sort?: string; // e.g., 'date,asc', 'name,asc', 'relevance,desc'

  // Include flags
  includeTBA?: 'yes' | 'no' | 'only';
  includeTBD?: 'yes' | 'no' | 'only';
  includeTest?: 'yes' | 'no' | 'only';
  includeSpellcheck?: 'yes' | 'no';

  // Source
  source?: 'ticketmaster' | 'universe' | 'frontgate' | 'tmr';
}

export interface TMVenueSearchParams {
  keyword?: string;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  latlong?: string;
  radius?: string;
  unit?: 'miles' | 'km';
  size?: number;
  page?: number;
  sort?: string;
  includeTest?: 'yes' | 'no' | 'only';
}

// === Parsed/Normalized Types for Our Use ===

export interface TMEventMatch {
  tmEvent: TMEvent;
  confidence: number; // 0-1
  matchedBy: 'title' | 'title+llm' | 'attraction';
}

export interface TMEnrichmentData {
  tmEventId: string;
  tmEventName: string; // Full TM event name (often more descriptive)
  tmUrl: string | null;
  tmPriceMin: number | null;
  tmPriceMax: number | null;
  tmPriceCurrency: string | null;
  tmOnSaleStart: Date | null;
  tmOnSaleEnd: Date | null;
  tmPresales: TMPresale[] | null;
  tmImageUrl: string | null;
  tmAttractionId: string | null;
  tmAttractionName: string | null;
  tmGenre: string | null;
  tmSubGenre: string | null;
  tmSegment: string | null;
  tmSupportingActs: string[];
  tmExternalLinks: Record<string, string> | null;
  tmMatchConfidence: number;
  preferTMTitle: boolean; // LLM recommends using TM title over venue title
}

