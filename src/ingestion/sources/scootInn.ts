import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Scrape events from Scoot Inn website.
 * 
 * Scoot Inn is a LiveNation venue-sites platform that loads events via JavaScript.
 * We use Puppeteer to render the page and extract event data.
 * 
 * URL: https://www.scootinnaustin.com/shows
 */
export async function fetchEventsFromScootInn(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    console.log("Scoot Inn: Starting scraper...");
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to shows page
    await page.goto('https://www.scootinnaustin.com/shows', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    
    // Wait for page to fully render (JSON-LD is usually in initial HTML)
    console.log("Scoot Inn: Waiting for page to render...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the rendered HTML
    const html = await page.content();
    const $ = load(html);
    
    // Debug: log the page structure
    console.log("Scoot Inn: Page title:", $('title').text());
    
    // Method 1: Try JSON-LD first (most reliable for LiveNation sites)
    console.log("Scoot Inn: Trying JSON-LD extraction...");
    
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
              venueSlug: 'scoot-inn',
              source: EventSource.VENUE_WEBSITE,
              sourceEventId: item.identifier || item.url?.split('/').pop(),
              url: item.url,
              imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
              category: inferCategory(item.name || ''),
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
    
    // Method 2: Fall back to DOM parsing if JSON-LD didn't work
    if (events.length === 0) {
      console.log("Scoot Inn: JSON-LD not found, trying DOM parsing...");
      
      $('a[href*="/event/"]').each((_, el) => {
        try {
          const $link = $(el);
          const href = $link.attr('href') || '';
          
          if (!href.includes('/event/')) return;
          
          const $container = $link.closest('[class*="card"], [class*="Card"], article, li, div').first();
          
          let title = '';
          const $heading = $container.find('h1, h2, h3, h4, [class*="title"], [class*="Title"]').first();
          if ($heading.length) {
            title = $heading.text().trim();
          }
          
          if (!title || title.length < 2) return;
          
          let dateStr = '';
          const $date = $container.find('[class*="date"], [class*="Date"], time, [datetime]').first();
          if ($date.length) {
            dateStr = $date.attr('datetime') || $date.text().trim();
          }
          
          const $img = $container.find('img').first();
          const imageUrl = $img.attr('src') || $img.attr('data-src') || undefined;
          
          const eventUrl = href.startsWith('http') ? href : `https://www.scootinnaustin.com${href}`;
          
          let startDateTime: Date | null = null;
          if (dateStr) {
            startDateTime = parseScootInnDate(dateStr);
          }
          
          if (!startDateTime || isNaN(startDateTime.getTime())) {
            return; // Skip silently - DOM parsing is fallback
          }
          
          if (startDateTime < new Date()) {
            return;
          }
          
          const sourceEventId = extractEventId(eventUrl);
          const isDuplicate = events.some(e => e.sourceEventId === sourceEventId);
          if (isDuplicate) return;
          
          events.push({
            title,
            startDateTime,
            venueSlug: 'scoot-inn',
            source: EventSource.VENUE_WEBSITE,
            sourceEventId,
            url: eventUrl,
            imageUrl,
            category: inferCategory(title),
          });
          
        } catch (error) {
          console.error("Scoot Inn: Error parsing event:", error);
        }
      });
    }
    
    console.log(`Scoot Inn: Extracted ${events.length} events`);
    
  } catch (error) {
    console.error("Error scraping Scoot Inn:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return events;
}

/**
 * Parse date strings from Scoot Inn website
 */
function parseScootInnDate(dateStr: string): Date | null {
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
    
    // Try "DEC 14" format
    const shortMatch = dateStr.match(/([A-Za-z]+)\s+(\d+)/);
    if (shortMatch) {
      const [, month, day] = shortMatch;
      const year = new Date().getFullYear();
      const attempt = new Date(`${month} ${day}, ${year}`);
      
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
function extractEventId(url: string): string | undefined {
  // Try to extract ID from URL patterns like /event/12345 or /shows/some-event-name
  const match = url.match(/\/event\/([^/?]+)/) || url.match(/\/shows\/([^/?]+)/);
  return match ? `scoot-inn-${match[1]}` : undefined;
}

/**
 * Infer event category from title
 */
function inferCategory(title: string): EventCategory {
  const lower = title.toLowerCase();
  
  if (lower.includes('comedy') || lower.includes('stand-up') || lower.includes('comedian')) {
    return EventCategory.COMEDY;
  }
  
  if (lower.includes('dj') || lower.includes('edm') || lower.includes('electronic')) {
    return EventCategory.CONCERT;
  }
  
  if (lower.includes('festival') || lower.includes('fest')) {
    return EventCategory.FESTIVAL;
  }
  
  // Default to concert for music venues
  return EventCategory.CONCERT;
}

