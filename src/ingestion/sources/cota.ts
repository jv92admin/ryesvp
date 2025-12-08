import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { createAustinDate } from '@/lib/utils';

/**
 * Scrape events from Circuit of the Americas (COTA) website.
 * 
 * COTA hosts F1, MotoGP, NASCAR, concerts at Germania Insurance Amphitheater,
 * and various community events. Uses a simple grid layout - no pagination.
 * 
 * URL: https://circuitoftheamericas.com/events/
 */
export async function fetchEventsFromCOTA(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  
  try {
    console.log('COTA: Starting scraper...');
    
    const response = await fetch('https://circuitoftheamericas.com/events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch COTA events: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Find all event columns in the grid view
    const eventColumns = $('.event-grid-ctn .event-column.column').toArray();
    console.log(`COTA: Found ${eventColumns.length} event columns`);
    
    const seenUrls = new Set<string>();
    
    for (const column of eventColumns) {
      try {
        const $col = $(column);
        
        // Skip sponsor/ad entries
        const tag = $col.find('.event-tag').text().trim().toLowerCase();
        if (tag === 'sponsor') {
          continue;
        }
        
        // Extract title and URL
        const titleLink = $col.find('h3.heading-6 a').first();
        const title = titleLink.text().trim();
        const eventUrl = titleLink.attr('href') || '';
        
        if (!title || !eventUrl) {
          continue;
        }
        
        // Deduplicate by URL
        if (seenUrls.has(eventUrl)) {
          continue;
        }
        seenUrls.add(eventUrl);
        
        // Extract date
        const dateStr = $col.find('.event-date').text().trim();
        const startDateTime = parseCOTADate(dateStr);
        
        if (!startDateTime) {
          console.log(`COTA: Skipping event with invalid date: ${title} (${dateStr})`);
          continue;
        }
        
        // Skip past events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(startDateTime);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          continue;
        }
        
        // Extract image URL from background-image style
        const imageEl = $col.find('.event-image a');
        let imageUrl: string | null = null;
        const bgStyle = imageEl.attr('style') || '';
        const bgMatch = bgStyle.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
        if (bgMatch) {
          imageUrl = bgMatch[1];
        }
        // Also check data-bg attribute (lazy loading)
        if (!imageUrl) {
          imageUrl = imageEl.attr('data-bg') || null;
        }
        
        // Create external ID from URL
        const urlSlug = eventUrl.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 100);
        
        // Determine category based on tag
        const category = categorizeCOTAEvent(tag, title);
        
        events.push({
          sourceEventId: `cota-${urlSlug}`,
          title,
          startDateTime,
          endDateTime: null,
          url: eventUrl,
          imageUrl,
          description: null,
          source: EventSource.VENUE_WEBSITE,
          category,
          venueSlug: 'cota',
        });
        
      } catch (err) {
        console.error('COTA: Error parsing event column:', err);
      }
    }
    
    console.log(`COTA: Successfully parsed ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error('Error scraping COTA:', error);
    throw error;
  }
}

/**
 * Parse COTA date formats:
 * - "March 14, 2026" - single date
 * - "February 27-March 1, 2026" - date range (use start date)
 * - "November 21 2025, January 4 2026" - multiple dates (use first)
 * - "SEPTEMBER 11-13, 2026" - uppercase range
 */
function parseCOTADate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Normalize: trim and lowercase for parsing
  const normalized = dateStr.trim();
  
  // Handle multiple dates separated by comma (take first date)
  // e.g., "November 21 2025, January 4 2026"
  if (normalized.includes(',')) {
    const parts = normalized.split(',');
    // Check if first part has a year
    const firstPart = parts[0].trim();
    if (/\d{4}/.test(firstPart)) {
      return parseSimpleDate(firstPart);
    }
    // If no year in first part, it might be "Month DD-DD, YYYY" format
    // Try the whole string
  }
  
  // Handle date ranges (take start date)
  // e.g., "February 27-March 1, 2026" or "September 11-13, 2026"
  const rangeMatch = normalized.match(/^([A-Za-z]+)\s+(\d{1,2})[-–](?:[A-Za-z]+\s+)?(\d{1,2})?,?\s*(\d{4})$/i);
  if (rangeMatch) {
    const month = rangeMatch[1];
    const day = rangeMatch[2];
    const year = rangeMatch[4];
    return parseSimpleDate(`${month} ${day}, ${year}`);
  }
  
  // Try simple date parsing
  return parseSimpleDate(normalized);
}

/**
 * Parse a simple date string like "March 14, 2026" or "November 21 2025"
 */
function parseSimpleDate(dateStr: string): Date | null {
  // Manual parsing to ensure we create dates in Austin timezone
  const monthMap: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'may': 4, 'june': 5, 'july': 6, 'august': 7,
    'september': 8, 'october': 9, 'november': 10, 'december': 11,
  };
  
  // Match formats like "March 14, 2026" or "March 14 2026"
  const match = dateStr.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (match) {
    const month = monthMap[match[1].toLowerCase()];
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      // Create date in Austin timezone (7 PM default for events)
      return createAustinDate(year, month, day, 19, 0);
    }
  }
  
  return null;
}

/**
 * Categorize COTA events based on tag and title
 */
function categorizeCOTAEvent(tag: string, title: string): EventCategory {
  const lowerTag = tag.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Motorsports
  if (lowerTag === 'motorsports' || 
      lowerTitle.includes('f1') || lowerTitle.includes('formula') ||
      lowerTitle.includes('motogp') || lowerTitle.includes('nascar') ||
      lowerTitle.includes('grand prix') || lowerTitle.includes('racing')) {
    return EventCategory.SPORTS;
  }
  
  // Concerts
  if (lowerTag === 'concerts' || lowerTag === 'concert') {
    return EventCategory.CONCERT;
  }
  
  // Community events
  if (lowerTag === 'community') {
    return EventCategory.OTHER;
  }
  
  // Festival-like events
  if (lowerTitle.includes('festival') || lowerTitle.includes('fest')) {
    return EventCategory.FESTIVAL;
  }
  
  // Default to OTHER
  return EventCategory.OTHER;
}

