import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import * as cheerio from 'cheerio';
import { launchBrowser } from '@/lib/browser';
import { createAustinDate, getStartOfTodayAustin } from '@/lib/utils';

type CheerioAPI = ReturnType<typeof cheerio.load>;
type CheerioElement = cheerio.Element;

/**
 * Scrape events from Emo's Austin website.
 * 
 * Emo's uses a LiveNation-powered site that loads events via JavaScript.
 * We use Puppeteer to render the page and extract event data.
 * 
 * The page has two data sources:
 * 1. JSON-LD structured data (usually incomplete - misses some events)
 * 2. DOM structure with event cards
 * 
 * We extract from BOTH and merge to get complete coverage.
 * 
 * URL: https://www.emosaustin.com/shows
 */
export async function fetchEventsFromEmos(): Promise<NormalizedEvent[]> {
  const eventsMap = new Map<string, NormalizedEvent>(); // Use map for deduplication
  let browser;
  
  try {
    console.log("Emo's: Starting scraper...");
    
    browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to shows page
    await page.goto('https://www.emosaustin.com/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for events to load
    console.log("Emo's: Waiting for events to load...");
    
    // Give time for events to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroll to bottom multiple times to trigger lazy loading of all events
    console.log("Emo's: Scrolling to load all events...");
    for (let i = 0; i < 5; i++) {
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Scroll back up and down again to ensure all content loads
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Final slow scroll to load any remaining lazy content
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight + 1000) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });
    
    // Wait for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the rendered HTML
    const html = await page.content();
    const $ = cheerio.load(html);
    
    console.log("Emo's: Page title:", $('title').text());
    
    // Method 1: Extract from JSON-LD (gets most events but may miss some)
    console.log("Emo's: Trying JSON-LD extraction...");
    extractFromJsonLd($, eventsMap);
    console.log(`Emo's: JSON-LD found ${eventsMap.size} events`);
    
    // Method 2: Extract from DOM structure (catches events missed by JSON-LD)
    console.log("Emo's: Trying DOM extraction...");
    const domEventsBefore = eventsMap.size;
    extractFromDom($, eventsMap);
    console.log(`Emo's: DOM added ${eventsMap.size - domEventsBefore} new events`);
    
    console.log(`Emo's: Total extracted ${eventsMap.size} events`);
    
  } catch (error) {
    console.error("Error scraping Emo's:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return Array.from(eventsMap.values());
}

/**
 * Extract events from JSON-LD structured data
 */
function extractFromJsonLd($: CheerioAPI, eventsMap: Map<string, NormalizedEvent>): void {
  $('script[type="application/ld+json"]').each((_: number, el: CheerioElement) => {
    try {
      const jsonText = $(el).html();
      if (!jsonText) return;
      
      const data = JSON.parse(jsonText);
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent') {
          const startDateTime = new Date(item.startDate);
          
          if (isNaN(startDateTime.getTime())) {
            continue;
          }
          
          // Skip past events (using Austin midnight cutoff)
          if (startDateTime < getStartOfTodayAustin()) {
            continue;
          }
          
          const title = item.name?.trim();
          if (!title) continue;
          
          // Create dedup key from title + date
          const dedupKey = `${title.toLowerCase()}-${startDateTime.toISOString().split('T')[0]}`;
          
          if (!eventsMap.has(dedupKey)) {
            const event: NormalizedEvent = {
              title,
              startDateTime,
              venueSlug: 'emos',
              source: EventSource.VENUE_WEBSITE,
              sourceEventId: item.identifier || item.url?.split('/').pop(),
              url: item.url,
              imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
              category: EventCategory.CONCERT,
            };
            eventsMap.set(dedupKey, event);
          }
        }
      }
    } catch {
      // JSON parse error, skip
    }
  });
}

/**
 * Extract events from DOM structure
 * 
 * Emo's uses Chakra UI. Event cards have this structure:
 * - Cards: div elements with chakra-card classes
 * - Title: in card body
 * - Date: format "Day Mon DD, YYYY" (e.g., "Fri Jul 31, 2026")
 * - Time: format "H:MMPM" (e.g., "7:00PM")  
 * - Buy Ticket link: <a> with href to ticketmaster.com in chakra-card__footer
 *   URL format: ticketmaster.com/artist-name-city-state-MM-DD-YYYY/event/ID
 * 
 * We ONLY use DOM extraction to find events NOT already in JSON-LD.
 * The primary source is JSON-LD; DOM is a fallback for missing events.
 */
function extractFromDom($: CheerioAPI, eventsMap: Map<string, NormalizedEvent>): void {
  // Find Ticketmaster links and extract event info from URL
  // This catches events that aren't in JSON-LD (like Chance Peña)
  const tmLinks = $('a[href*="ticketmaster.com"]');
  
  tmLinks.each((_: number, el: CheerioElement) => {
    try {
      const $link = $(el);
      const href = $link.attr('href') || '';
      
      // Extract date from Ticketmaster URL
      // Format: ticketmaster.com/artist-name-city-state-MM-DD-YYYY/event/ID
      const urlDateMatch = href.match(/(\d{2})-(\d{2})-(\d{4})\/event/);
      if (!urlDateMatch) {
        return;
      }
      
      const [, month, day, year] = urlDateMatch;
      // Use createAustinDate for proper timezone handling (default 8 PM, refined below if time found)
      let startDateTime = createAustinDate(parseInt(year), parseInt(month) - 1, parseInt(day), 20, 0);

      if (isNaN(startDateTime.getTime()) || startDateTime < getStartOfTodayAustin()) {
        return;
      }
      
      // Extract title from URL slug (most reliable)
      // URL format: ticketmaster.com/artist-name-city-state-MM-DD-YYYY/event/ID
      const slugMatch = href.match(/ticketmaster\.com\/([^/]+)-(\d{2})-(\d{2})-(\d{4})/);
      if (!slugMatch) return;
      
      const slug = slugMatch[1];
      
      // Parse slug into title, removing city/state
      const slugParts = slug.split('-');
      // Remove trailing location parts (austin, texas, tx, etc.)
      const locationWords = ['austin', 'texas', 'tx', 'cedar', 'park'];
      while (slugParts.length > 0 && locationWords.includes(slugParts[slugParts.length - 1].toLowerCase())) {
        slugParts.pop();
      }
      
      if (slugParts.length === 0) return;
      
      const title = slugParts
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      if (!title || title.length < 2) return;
      
      // Check if we already have an event on this date with similar title
      const dateKey = startDateTime.toISOString().split('T')[0];
      const titleNormalized = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if any existing event matches (same date + similar title)
      let isDuplicate = false;
      for (const [, existingEvent] of eventsMap) {
        const existingDate = existingEvent.startDateTime.toISOString().split('T')[0];
        
        // Check if dates match (within 1 day to handle timezone issues)
        const existingDateObj = new Date(existingDate);
        const newDateObj = new Date(dateKey);
        const daysDiff = Math.abs((existingDateObj.getTime() - newDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          // Same or adjacent day - check if title is similar
          const existingNormalized = existingEvent.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Check for substantial overlap (one contains significant part of the other)
          const minLength = Math.min(titleNormalized.length, existingNormalized.length);
          const shorterTitle = titleNormalized.length < existingNormalized.length ? titleNormalized : existingNormalized;
          const longerTitle = titleNormalized.length >= existingNormalized.length ? titleNormalized : existingNormalized;
          
          // If shorter title is at least 60% of longer title and is contained in it, it's a match
          if (minLength >= 5 && (longerTitle.includes(shorterTitle) || shorterTitle.slice(0, 10) === longerTitle.slice(0, 10))) {
            isDuplicate = true;
            break;
          }
        }
      }
      
      if (isDuplicate) return;
      
      // Create dedup key
      const dedupKey = `${titleNormalized}-${dateKey}`;
      if (eventsMap.has(dedupKey)) return;
      
      // Find time from surrounding text
      const $card = $link.closest('[class*="chakra-card"], [class*="card"], div').first();
      const cardText = $card.length ? $card.text() : '';
      const timeMatch = cardText.match(/(\d{1,2}:\d{2}\s*(AM|PM))/i);
      
      if (timeMatch) {
        const timeParts = timeMatch[1].match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const mins = parseInt(timeParts[2], 10);
          const isPM = timeParts[3].toUpperCase() === 'PM';

          if (isPM && hours !== 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;

          // Rebuild with correct time in Austin timezone
          startDateTime = createAustinDate(parseInt(year), parseInt(month) - 1, parseInt(day), hours, mins);
        }
      }
      
      // Find image
      const $img = $card.find('img').first();
      const imageUrl = $img.attr('src') || $img.attr('data-src') || undefined;
      
      const event: NormalizedEvent = {
        title,
        startDateTime,
        venueSlug: 'emos',
        source: EventSource.VENUE_WEBSITE,
        sourceEventId: href.match(/event\/([A-Z0-9]+)/)?.[1],
        url: href.split('?')[0], // Remove tracking params
        imageUrl,
        category: inferEventCategory(title),
      };
      
      console.log(`Emo's: DOM found new event: ${title} on ${dateKey}`);
      eventsMap.set(dedupKey, event);
      
    } catch {
      // Skip this link on error
    }
  });
}

/**
 * Infer event category from title
 */
function inferEventCategory(title: string): EventCategory {
  const lower = title.toLowerCase();
  
  if (lower.includes('comedy') || lower.includes('stand-up') || lower.includes('comedian')) {
    return EventCategory.COMEDY;
  }
  
  if (lower.includes('dj') || lower.includes('edm') || lower.includes('electronic')) {
    return EventCategory.CONCERT; // Could add ELECTRONIC category later
  }
  
  // Default to concert for music venues
  return EventCategory.CONCERT;
}
