import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import * as cheerio from 'cheerio';
import { createAustinDate, getStartOfTodayAustin } from '@/lib/utils';
import { inferYear } from '../utils/dateParser';

type CheerioAPI = ReturnType<typeof cheerio.load>;

/**
 * Scrape events from Antone's Nightclub website.
 * 
 * Antone's is a legendary blues venue in downtown Austin.
 * The site uses a paginated list (currently 3 pages).
 * 
 * URL: https://antonesnightclub.com/
 */
export async function fetchEventsFromAntones(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const seenUrls = new Set<string>();
  
  console.log("Antone's: Starting scraper...");
  
  // Fetch all pages (currently 3)
  const baseUrl = 'https://antonesnightclub.com';
  const pages = [
    baseUrl,
    `${baseUrl}/page/2/`,
    `${baseUrl}/page/3/`,
  ];
  
  for (const pageUrl of pages) {
    try {
      console.log(`Antone's: Fetching ${pageUrl}...`);
      
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
      
      if (!response.ok) {
        // Page might not exist (e.g., if fewer pages now)
        if (response.status === 404) {
          console.log(`Antone's: Page ${pageUrl} not found, stopping pagination`);
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Parse events from this page
      const pageEvents = parseAntonesPage($, seenUrls);
      events.push(...pageEvents);
      
      console.log(`Antone's: Found ${pageEvents.length} events on page`);
      
    } catch (error) {
      console.error(`Antone's: Error fetching ${pageUrl}:`, error);
      // Continue to next page on error
    }
  }
  
  console.log(`Antone's: Total ${events.length} events extracted`);
  return events;
}

/**
 * Parse events from a single page of Antone's website
 */
function parseAntonesPage($: CheerioAPI, seenUrls: Set<string>): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  
  // Each event is in a .tw-section.tw-section--list container
  $('.tw-section.tw-section--list').each((_, section) => {
    try {
      const $section = $(section);
      
      // Extract event URL and title
      const $titleLink = $section.find('.tw-name a').first();
      const title = $titleLink.text().trim();
      const eventUrl = $titleLink.attr('href') || '';
      
      if (!title || !eventUrl) {
        return; // Skip if missing essential data
      }
      
      // Skip duplicates (same event might appear on multiple pages during transition)
      if (seenUrls.has(eventUrl)) {
        return;
      }
      seenUrls.add(eventUrl);
      
      // Extract date - format: "December 06, 2025"
      const dateStr = $section.find('.tw-event-date').text().trim();
      
      // Extract time - format: "8:00pm"
      const timeStr = $section.find('.tw-event-time').text().trim();
      
      // Parse date and time
      const startDateTime = parseAntonesDateTime(dateStr, timeStr);
      
      if (!startDateTime || isNaN(startDateTime.getTime())) {
        console.log(`Antone's: Skipping "${title}" - invalid date: ${dateStr} ${timeStr}`);
        return;
      }
      
      // Skip past events (using Austin midnight cutoff)
      if (startDateTime < getStartOfTodayAustin()) {
        return;
      }
      
      // Extract image
      const $img = $section.find('.tw-image img').first();
      const imageUrl = $img.attr('src') || undefined;
      
      // Extract description (optional)
      const description = $section.find('.event-description').text().trim() || undefined;
      
      // Extract source event ID from URL
      // URLs like: https://antonesnightclub.com/tm-event/keller-williams/
      const sourceEventId = extractEventIdFromUrl(eventUrl);
      
      events.push({
        title: cleanTitle(title),
        startDateTime,
        venueSlug: 'antones',
        source: EventSource.VENUE_WEBSITE,
        sourceEventId,
        url: eventUrl,
        imageUrl,
        description,
        category: inferCategory(title),
      });
      
    } catch (error) {
      console.error("Antone's: Error parsing event:", error);
    }
  });
  
  return events;
}

/**
 * Parse date and time strings from Antone's format
 * Date format: "December 06, 2025"
 * Time format: "8:00pm"
 */
function parseAntonesDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    if (!dateStr) return null;
    
    // Parse date
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    
    const dateMatch = dateStr.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
    let monthNum: number;
    let dayNum: number;
    let yearNum: number;
    
    if (!dateMatch) {
      // Try alternate format without year
      const shortMatch = dateStr.match(/(\w+)\s+(\d{1,2})/);
      if (shortMatch) {
        const [, monthName, day] = shortMatch;
        monthNum = months[monthName.toLowerCase()] ?? 0;
        dayNum = parseInt(day, 10);
        // Use Austin-aware year inference (day-level comparison)
        yearNum = inferYear(monthNum, dayNum);
      } else {
        return null;
      }
    } else {
      const [, monthName, day, year] = dateMatch;
      monthNum = months[monthName.toLowerCase()] ?? 0;
      dayNum = parseInt(day, 10);
      yearNum = parseInt(year, 10);
    }
    
    // Parse time (e.g., "8:00pm", "9:30pm")
    let hours = 19; // Default to 7pm if no time
    let minutes = 0;
    
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const isPM = timeMatch[3]?.toLowerCase() === 'pm';
        
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
      }
    }
    
    // Build the date in Austin timezone
    return createAustinDate(yearNum, monthNum, dayNum, hours, minutes);
  } catch {
    return null;
  }
}

/**
 * Extract event ID from URL
 * URL format: https://antonesnightclub.com/tm-event/keller-williams/
 */
function extractEventIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/tm-event\/([^/?]+)/);
  if (match) {
    return `antones-${match[1]}`;
  }
  // Fallback: use last path segment
  const segments = url.split('/').filter(Boolean);
  return segments.length > 0 ? `antones-${segments[segments.length - 1]}` : undefined;
}

/**
 * Clean up event title
 * Remove common prefixes like "SOLD OUT:" etc.
 */
function cleanTitle(title: string): string {
  // Keep SOLD OUT in title as useful info, just normalize
  return title
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Infer event category from title
 */
function inferCategory(title: string): EventCategory {
  const lower = title.toLowerCase();
  
  // Blues venue, so most events are concerts
  if (lower.includes('comedy') || lower.includes('stand-up') || lower.includes('comedian')) {
    return EventCategory.COMEDY;
  }
  
  if (lower.includes('blues fest') || lower.includes('festival')) {
    return EventCategory.FESTIVAL;
  }
  
  // Default to concert for Antone's
  return EventCategory.CONCERT;
}

