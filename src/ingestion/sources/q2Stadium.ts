import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { createAustinDate } from '@/lib/utils';

/**
 * Scrape events from Q2 Stadium website (Austin FC home).
 * 
 * Q2 Stadium hosts Austin FC MLS matches and occasional concerts/events.
 * Uses a simple list view - no pagination needed.
 * 
 * URL: https://www.q2stadium.com/events/?view=list
 */
export async function fetchEventsFromQ2Stadium(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  
  try {
    console.log('Q2 Stadium: Starting scraper...');
    
    const response = await fetch('https://www.q2stadium.com/events/?view=list', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Q2 Stadium events: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Find all event list containers
    const eventContainers = $('.events-list-container').toArray();
    console.log(`Q2 Stadium: Found ${eventContainers.length} event containers`);
    
    const seenUrls = new Set<string>();
    
    for (const container of eventContainers) {
      try {
        const $container = $(container);
        
        // Extract title and URL from h3 link
        const titleLink = $container.find('h3.heading-4 a').first();
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
        const dateStr = $container.find('.event-date').text().trim();
        const startDateTime = parseQ2Date(dateStr);
        
        if (!startDateTime) {
          console.log(`Q2 Stadium: Skipping event with invalid date: ${title} (${dateStr})`);
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
        const imageEl = $container.find('.event-image a');
        let imageUrl: string | null = null;
        const bgStyle = imageEl.attr('style') || '';
        const bgMatch = bgStyle.match(/background-image:\s*url\(([^)]+)\)/);
        if (bgMatch) {
          imageUrl = bgMatch[1].replace(/['"]/g, '');
        }
        
        // Create external ID from URL slug
        const urlSlug = eventUrl.split('/').filter(Boolean).pop() || '';
        
        // Determine category - mostly sports (Austin FC), but could be concerts
        const category = categorizeQ2Event(title);
        
        events.push({
          sourceEventId: `q2-stadium-${urlSlug}`,
          title,
          startDateTime,
          endDateTime: null,
          url: eventUrl,
          imageUrl,
          description: null,
          source: EventSource.VENUE_WEBSITE,
          category,
          venueSlug: 'q2-stadium',
        });
        
      } catch (err) {
        console.error('Q2 Stadium: Error parsing event container:', err);
      }
    }
    
    console.log(`Q2 Stadium: Successfully parsed ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error('Error scraping Q2 Stadium:', error);
    throw error;
  }
}

/**
 * Parse Q2 Stadium date format: "February 21, 2026"
 */
function parseQ2Date(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  
  // Parse manually: "February 21, 2026"
  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (match) {
    const [, monthName, day, year] = match;
    const monthNum = months[monthName.toLowerCase()];
    if (monthNum !== undefined) {
      // Create date in Austin timezone with default 7:30 PM
      return createAustinDate(parseInt(year), monthNum, parseInt(day), 19, 30);
    }
  }
  
  return null;
}

/**
 * Categorize Q2 Stadium events
 */
function categorizeQ2Event(title: string): EventCategory {
  const lowerTitle = title.toLowerCase();
  
  // Soccer/MLS matches
  if (lowerTitle.includes('austin fc') || lowerTitle.includes('vs.') || 
      lowerTitle.includes('vs ') || lowerTitle.includes('fc ')) {
    return EventCategory.SPORTS;
  }
  
  // Concerts
  if (lowerTitle.includes('concert') || lowerTitle.includes('tour')) {
    return EventCategory.CONCERT;
  }
  
  // Default to sports (it's a soccer stadium)
  return EventCategory.SPORTS;
}

