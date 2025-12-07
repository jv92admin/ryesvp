import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Scrape events from Emo's Austin website.
 * 
 * Emo's uses a LiveNation-powered site that loads events via JavaScript.
 * We use Puppeteer to render the page and extract event data.
 * 
 * URL: https://www.emosaustin.com/shows
 */
export async function fetchEventsFromEmos(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    console.log("Emo's: Starting scraper...");
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to shows page
    await page.goto('https://www.emosaustin.com/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for events to load - LiveNation sites typically use these patterns
    console.log("Emo's: Waiting for events to load...");
    
    // Try common LiveNation selectors
    const selectors = [
      '[data-testid="event-card"]',
      '.event-card',
      '.show-card',
      '[class*="EventCard"]',
      '[class*="event-listing"]',
      'article[class*="event"]',
      '.sc-', // Styled components often use sc- prefix
    ];
    
    let foundSelector: string | null = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        foundSelector = selector;
        console.log(`Emo's: Found events with selector: ${selector}`);
        break;
      } catch {
        // Try next selector
      }
    }
    
    // Give extra time for all events to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the rendered HTML
    const html = await page.content();
    const $ = load(html);
    
    // Debug: log the page structure
    console.log("Emo's: Page title:", $('title').text());
    
    // Try to find event containers by looking for common patterns
    // LiveNation sites often have event data in specific structures
    
    // Look for links to event pages (common pattern)
    const eventLinks = $('a[href*="/event/"], a[href*="/shows/"]').toArray();
    console.log(`Emo's: Found ${eventLinks.length} potential event links`);
    
    // Also look for any elements with date-like content
    const dateElements = $('[class*="date"], [class*="Date"], time').toArray();
    console.log(`Emo's: Found ${dateElements.length} date elements`);
    
    // Try to extract events from the page structure
    // LiveNation often uses specific div patterns
    
    // Method 1: Find event cards by structure
    $('a[href*="/event/"]').each((_, el) => {
      try {
        const $link = $(el);
        const href = $link.attr('href') || '';
        
        // Skip if not an event link
        if (!href.includes('/event/')) return;
        
        // Try to find parent container with event info
        const $card = $link.closest('[class*="card"], [class*="Card"], article, li');
        
        // Extract title - look for headings or specific elements
        let title = '';
        const $heading = $card.find('h1, h2, h3, h4, [class*="title"], [class*="Title"], [class*="name"], [class*="Name"]').first();
        if ($heading.length) {
          title = $heading.text().trim();
        } else {
          // Fallback to link text
          title = $link.text().trim();
        }
        
        if (!title || title.length < 2) return;
        
        // Extract date
        let dateStr = '';
        const $date = $card.find('[class*="date"], [class*="Date"], time, [datetime]').first();
        if ($date.length) {
          dateStr = $date.attr('datetime') || $date.text().trim();
        }
        
        // Extract image
        const $img = $card.find('img').first();
        const imageUrl = $img.attr('src') || $img.attr('data-src') || undefined;
        
        // Build event URL
        const eventUrl = href.startsWith('http') ? href : `https://www.emosaustin.com${href}`;
        
        // Parse date if we have one
        let startDateTime: Date | null = null;
        if (dateStr) {
          startDateTime = parseEmosDate(dateStr);
        }
        
        // Skip if we couldn't parse a valid date
        if (!startDateTime || isNaN(startDateTime.getTime())) {
          console.log(`Emo's: Skipping "${title}" - no valid date`);
          return;
        }
        
        // Skip past events
        if (startDateTime < new Date()) {
          return;
        }
        
        // Extract event ID from URL
        const sourceEventId = extractEventIdFromUrl(eventUrl);
        
        events.push({
          title,
          startDateTime,
          venueSlug: 'emos',
          source: EventSource.VENUE_WEBSITE,
          sourceEventId,
          url: eventUrl,
          imageUrl,
          category: inferEventCategory(title),
        });
        
      } catch (error) {
        console.error("Emo's: Error parsing event:", error);
      }
    });
    
    // If no events found with Method 1, try Method 2: JSON-LD
    if (events.length === 0) {
      console.log("Emo's: Trying JSON-LD extraction...");
      
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).html();
          if (!jsonText) return;
          
          const data = JSON.parse(jsonText);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent') {
              const event: NormalizedEvent = {
                title: item.name,
                startDateTime: new Date(item.startDate),
                venueSlug: 'emos',
                source: EventSource.VENUE_WEBSITE,
                sourceEventId: item.identifier || item.url?.split('/').pop(),
                url: item.url,
                imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
                category: EventCategory.CONCERT,
              };
              
              if (!isNaN(event.startDateTime.getTime()) && event.startDateTime > new Date()) {
                events.push(event);
              }
            }
          }
        } catch {
          // JSON parse error, skip
        }
      });
    }
    
    console.log(`Emo's: Extracted ${events.length} events`);
    
  } catch (error) {
    console.error("Error scraping Emo's:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return events;
}

/**
 * Parse date strings from Emo's website
 */
function parseEmosDate(dateStr: string): Date | null {
  try {
    // Try ISO format first (from datetime attribute)
    if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }
    
    // Try common formats: "Dec 15, 2025", "December 15, 2025", etc.
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Try parsing "Sat Dec 14" style (add current/next year)
    const dayMonthMatch = dateStr.match(/(\w+)\s+(\w+)\s+(\d+)/);
    if (dayMonthMatch) {
      const [, , month, day] = dayMonthMatch;
      const year = new Date().getFullYear();
      const attempt = new Date(`${month} ${day}, ${year}`);
      
      // If it's in the past, try next year
      if (attempt < new Date()) {
        return new Date(`${month} ${day}, ${year + 1}`);
      }
      return attempt;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract event ID from URL
 */
function extractEventIdFromUrl(url: string): string | undefined {
  // Try to extract ID from URL patterns like /event/12345 or /shows/some-event-name
  const match = url.match(/\/event\/([^/?]+)/) || url.match(/\/shows\/([^/?]+)/);
  return match ? match[1] : undefined;
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

