import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { launchBrowser } from '@/lib/browser';
import { createAustinDate, getStartOfTodayAustin } from '@/lib/utils';
import { inferYear } from '../utils/dateParser';

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
    
    browser = await launchBrowser();
    
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
            
            if (!isNaN(event.startDateTime.getTime()) && event.startDateTime >= getStartOfTodayAustin()) {
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
          
          if (startDateTime < getStartOfTodayAustin()) {
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
 * Uses createAustinDate for proper timezone handling.
 */
function parseScootInnDate(dateStr: string): Date | null {
  try {
    // Try ISO format first (from datetime attribute) — safe when offset is present
    if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }

    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      january: 0, february: 1, march: 2, april: 3, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };

    // Try "Dec 15, 2025" or "December 15, 2025" (with explicit year)
    const fullMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (fullMatch) {
      const monthNum = monthMap[fullMatch[1].toLowerCase()];
      if (monthNum !== undefined) {
        return createAustinDate(parseInt(fullMatch[3], 10), monthNum, parseInt(fullMatch[2], 10), 20, 0);
      }
    }

    // Try "Sat Dec 14" or "DEC 14" style (no year — infer it)
    const shortMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
    if (shortMatch) {
      // Could be "Sat Dec 14" — extract the month name (skip day-of-week)
      const parts = dateStr.trim().split(/\s+/);
      let monthName = '';
      let dayStr = '';

      if (parts.length >= 3) {
        // "Sat Dec 14" — second word is month
        monthName = parts[1];
        dayStr = parts[2];
      } else if (parts.length === 2) {
        // "DEC 14"
        monthName = parts[0];
        dayStr = parts[1];
      }

      const monthNum = monthMap[monthName.toLowerCase()];
      if (monthNum !== undefined) {
        const dayNum = parseInt(dayStr, 10);
        const year = inferYear(monthNum, dayNum);
        return createAustinDate(year, monthNum, dayNum, 20, 0);
      }
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

