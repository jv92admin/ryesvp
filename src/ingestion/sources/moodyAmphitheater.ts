import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';

/**
 * Scrape events from Moody Amphitheater at Waterloo Park.
 * 
 * Outdoor amphitheater venue in downtown Austin.
 * 
 * URL: https://www.moodyamphitheater.com/events-tickets
 */
export async function fetchEventsFromMoodyAmphitheater(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  
  console.log("Moody Amphitheater: Starting scraper...");
  
  try {
    const response = await fetch('https://www.moodyamphitheater.com/events-tickets', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Each event is in a .collection-item.w-dyn-item
    $('.collection-item.w-dyn-item').each((_, el) => {
      try {
        const $el = $(el);
        
        // Extract date components
        const weekday = $el.find('.date-weekday').text().trim();
        const month = $el.find('.date-month').text().trim();
        const day = $el.find('.date-day').text().trim();
        
        // Extract event info
        const tourName = $el.find('.event-title').text().trim();
        const headliner = $el.find('.event-headliner').text().trim();
        const support = $el.find('.event-support').text().trim();
        
        // Extract time
        const timeStr = $el.find('.event-time').text().trim();
        
        // Extract event detail URL
        const detailPath = $el.find('.link-block').attr('href') || '';
        const eventUrl = detailPath.startsWith('http') 
          ? detailPath 
          : `https://www.moodyamphitheater.com${detailPath}`;
        
        // Extract ticket URL (Ticketmaster link)
        const ticketUrl = $el.find('.ticket-button.primary-btn').attr('href') || '';
        
        // Build title - combine tour name and headliner
        let title = headliner;
        if (tourName && tourName !== headliner) {
          title = `${headliner}: ${tourName}`;
        }
        if (support) {
          title += ` ${support}`;
        }
        
        if (!title || !month || !day) {
          return; // Skip if missing essential data
        }
        
        // Parse date
        const startDateTime = parseDate(month, day, timeStr);
        
        if (!startDateTime || isNaN(startDateTime.getTime())) {
          console.log(`Moody Amphitheater: Skipping "${title}" - invalid date: ${month} ${day}`);
          return;
        }
        
        // Skip past events
        if (startDateTime < new Date()) {
          return;
        }
        
        // Extract source event ID from detail URL or ticket URL
        const sourceEventId = extractEventId(detailPath, ticketUrl);
        
        events.push({
          title: title.trim(),
          startDateTime,
          venueSlug: 'moody-amphitheater',
          source: EventSource.VENUE_WEBSITE,
          sourceEventId,
          url: eventUrl,
          category: inferCategory(title),
        });
        
      } catch (error) {
        console.error("Moody Amphitheater: Error parsing event:", error);
      }
    });
    
    console.log(`Moody Amphitheater: Extracted ${events.length} events`);
    
  } catch (error) {
    console.error("Error scraping Moody Amphitheater:", error);
  }
  
  return events;
}

/**
 * Parse date from month name, day, and time
 * Month format: "Mar", "Apr", etc.
 * Day format: "18", "25", etc.
 * Time format: "6:00 pm"
 */
function parseDate(month: string, day: string, timeStr: string): Date | null {
  try {
    // Map short month to full month
    const monthMap: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    };
    
    const monthNum = monthMap[month.toLowerCase()];
    if (monthNum === undefined) {
      return null;
    }
    
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) {
      return null;
    }
    
    // Determine year - if month is in the past, use next year
    const now = new Date();
    let year = now.getFullYear();
    const testDate = new Date(year, monthNum, dayNum);
    
    if (testDate < now) {
      year += 1;
    }
    
    // Parse time
    let hours = 19; // Default to 7pm
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
    
    const date = new Date(year, monthNum, dayNum, hours, minutes, 0, 0);
    return date;
    
  } catch {
    return null;
  }
}

/**
 * Extract event ID from URL
 */
function extractEventId(detailPath: string, ticketUrl: string): string | undefined {
  // Try to get from detail path: /events/miguel -> miguel
  const pathMatch = detailPath.match(/\/events\/([^/?]+)/);
  if (pathMatch) {
    return `moody-amp-${pathMatch[1]}`;
  }
  
  // Fallback to Ticketmaster event ID
  const tmMatch = ticketUrl.match(/\/event\/([A-Z0-9]+)/);
  if (tmMatch) {
    return `tm-${tmMatch[1]}`;
  }
  
  return undefined;
}

/**
 * Infer event category from title
 */
function inferCategory(title: string): EventCategory {
  const lower = title.toLowerCase();
  
  if (lower.includes('festival') || lower.includes('fest')) {
    return EventCategory.FESTIVAL;
  }
  
  if (lower.includes('comedy') || lower.includes('comedian')) {
    return EventCategory.COMEDY;
  }
  
  // Default to concert for amphitheater
  return EventCategory.CONCERT;
}

