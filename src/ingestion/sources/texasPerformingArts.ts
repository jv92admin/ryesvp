import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { launchBrowser } from '@/lib/browser';

/**
 * Scrape events from Texas Performing Arts (Bass Concert Hall, McCullough Theatre, etc.)
 * 
 * TPA uses WordPress with AJAX pagination. We use Puppeteer to click "View More"
 * until all events are loaded, then scrape the rendered HTML.
 * 
 * Event structure:
 * - .tpa__event-block - event container
 * - .eb-item__artist - event title
 * - .eb-item__date - date (e.g., "Nov 29, 2025" or "Dec 2 - 14, 2025")
 * - .eb-item__location - venue (Bass Concert Hall, McCullough Theatre, etc.)
 * - .eb-item__presenter - series (Broadway in Austin, Texas Welcomes, etc.)
 * - img[data-src] - image URL
 * - .btn-buy - ticket URL
 * - .eb-item__link - event detail URL
 */
export async function fetchEventsFromTPA(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    console.log('TPA: Starting scrape...');
    
    // Launch headless browser
    browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to events page
    await page.goto('https://texasperformingarts.org/events/events/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for initial events to load
    try {
      await page.waitForSelector('.tpa__event-block', { timeout: 15000 });
      console.log('TPA: Found event containers');
    } catch (e) {
      console.warn('TPA: Event containers not found, page may not have loaded');
      return events;
    }
    
    // Click "View More" button until all events are loaded
    let loadMoreClicks = 0;
    const maxClicks = 20; // Safety limit
    
    while (loadMoreClicks < maxClicks) {
      try {
        // Check if "View More" button exists and is visible
        const loadMoreBtn = await page.$('#load-more-btn');
        if (!loadMoreBtn) {
          console.log('TPA: No more "View More" button found');
          break;
        }
        
        // Check if button is visible (display: flex on parent)
        const isVisible = await page.evaluate(() => {
          const container = document.getElementById('load-more');
          return container && window.getComputedStyle(container).display !== 'none';
        });
        
        if (!isVisible) {
          console.log('TPA: "View More" button is hidden, all events loaded');
          break;
        }
        
        // Click the button
        await loadMoreBtn.click();
        loadMoreClicks++;
        console.log(`TPA: Clicked "View More" (${loadMoreClicks})`);
        
        // Wait for new events to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (e) {
        console.log('TPA: Error clicking "View More", assuming all events loaded');
        break;
      }
    }
    
    // Give it a bit more time for final render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the rendered HTML
    const html = await page.content();
    const $ = load(html);
    
    // Find all event blocks
    const eventBlocks = $('.tpa__event-block').toArray();
    console.log(`TPA: Found ${eventBlocks.length} event blocks`);
    
    for (const block of eventBlocks) {
      try {
        const $block = $(block);
        
        // Get event URL and title
        const linkEl = $block.find('.eb-item__link').first();
        const eventUrl = linkEl.attr('href') || '';
        
        // Get title from h4.eb-item__artist
        const titleEl = $block.find('.eb-item__artist').first();
        let title = titleEl.text().trim();
        
        // Clean up title (remove extra whitespace, em tags rendered as text)
        title = title.replace(/\s+/g, ' ').trim();
        
        if (!title) {
          console.log('TPA: Skipping event without title');
          continue;
        }
        
        // Get date
        const dateText = $block.find('.eb-item__date').text().trim();
        if (!dateText) {
          console.log(`TPA: Skipping "${title}" - no date`);
          continue;
        }
        
        // Parse date (handles both single dates and ranges)
        const { startDateTime, endDateTime } = parseTPADate(dateText);
        
        if (!startDateTime || isNaN(startDateTime.getTime())) {
          console.log(`TPA: Could not parse date "${dateText}" for "${title}"`);
          continue;
        }
        
        // Get venue/location within TPA
        const location = $block.find('.eb-item__location').text().trim();
        const venueSlug = mapLocationToVenueSlug(location);
        
        // Get presenter/series
        const presenter = $block.find('.eb-item__presenter').text().trim();
        
        // Get image URL from data-src
        const imgEl = $block.find('img[data-src]').first();
        const imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || null;
        
        // Get ticket URL
        const ticketEl = $block.find('.btn-buy').first();
        const ticketUrl = ticketEl.attr('href') || eventUrl;
        
        // Check event status (on_sale, cancelled, etc.)
        const isCancelled = $block.hasClass('tpa--event-status-cancelled');
        if (isCancelled) {
          console.log(`TPA: Skipping cancelled event "${title}"`);
          continue;
        }
        
        // Create unique source ID from URL
        const sourceEventId = extractSourceId(eventUrl);
        
        // Determine category based on presenter/series
        const category = inferTPACategory(presenter, title);
        
        // Build description from presenter if available
        const description = presenter ? `${presenter}` : null;
        
        events.push({
          venueSlug,
          title,
          description,
          startDateTime,
          endDateTime,
          url: ticketUrl || eventUrl,
          imageUrl,
          category,
          source: EventSource.VENUE_WEBSITE,
          sourceEventId,
        });
        
      } catch (error) {
        console.error('TPA: Error parsing event block:', error);
      }
    }
    
    console.log(`TPA: Successfully scraped ${events.length} events`);
    
  } catch (error) {
    console.error('TPA: Error scraping:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return events;
}

/**
 * Map TPA location to venue slug
 */
function mapLocationToVenueSlug(location: string): string {
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes('bass concert hall')) {
    return 'bass-concert-hall';
  }
  if (locationLower.includes('mccullough')) {
    return 'mccullough-theatre';
  }
  if (locationLower.includes('bates recital')) {
    return 'bates-recital-hall';
  }
  if (locationLower.includes('wildflower')) {
    return 'lady-bird-wildflower-center';
  }
  
  // Default to Bass Concert Hall for TPA events
  return 'bass-concert-hall';
}

/**
 * Parse TPA date format
 * Single: "Nov 29, 2025"
 * Range: "Dec 2 - 14, 2025" or "Sep 25 - Nov 30, 2025"
 */
function parseTPADate(dateText: string): { startDateTime: Date | null; endDateTime: Date | null } {
  try {
    // Check if it's a date range
    if (dateText.includes(' - ')) {
      return parseDateRange(dateText);
    }
    
    // Single date
    const parsed = parseSimpleDate(dateText);
    return { startDateTime: parsed, endDateTime: null };
    
  } catch (error) {
    console.error('TPA: Error parsing date:', error);
    return { startDateTime: null, endDateTime: null };
  }
}

/**
 * Parse a simple date like "Nov 29, 2025"
 */
function parseSimpleDate(dateStr: string): Date | null {
  // Try native parsing first
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // Set time to 7:30 PM (common show time)
    parsed.setHours(19, 30, 0, 0);
    return parsed;
  }
  
  // Manual parsing: "Nov 29, 2025"
  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    const months: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    
    const monthNum = months[month.toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(year), monthNum, parseInt(day), 19, 30);
    }
  }
  
  return null;
}

/**
 * Parse a date range like "Dec 2 - 14, 2025" or "Sep 25 - Nov 30, 2025"
 */
function parseDateRange(dateStr: string): { startDateTime: Date | null; endDateTime: Date | null } {
  const parts = dateStr.split(' - ');
  if (parts.length !== 2) {
    return { startDateTime: null, endDateTime: null };
  }
  
  const [startPart, endPart] = parts;
  
  // Check if end part has month or just day
  // "Dec 2 - 14, 2025" -> endPart is "14, 2025"
  // "Sep 25 - Nov 30, 2025" -> endPart is "Nov 30, 2025"
  
  const endHasMonth = /[a-zA-Z]/.test(endPart);
  
  if (endHasMonth) {
    // Both parts are complete dates
    const startDate = parseSimpleDate(startPart + ', ' + endPart.match(/\d{4}/)?.[0]);
    const endDate = parseSimpleDate(endPart);
    return { startDateTime: startDate, endDateTime: endDate };
  } else {
    // End part is just day + year, inherit month from start
    const startMatch = startPart.match(/(\w+)\s+(\d+)/);
    const endMatch = endPart.match(/(\d+),?\s+(\d{4})/);
    
    if (startMatch && endMatch) {
      const [, startMonth, startDay] = startMatch;
      const [, endDay, year] = endMatch;
      
      const startDate = parseSimpleDate(`${startMonth} ${startDay}, ${year}`);
      const endDate = parseSimpleDate(`${startMonth} ${endDay}, ${year}`);
      
      return { startDateTime: startDate, endDateTime: endDate };
    }
  }
  
  return { startDateTime: null, endDateTime: null };
}

/**
 * Extract source ID from event URL
 */
function extractSourceId(url: string): string {
  // URL like: https://texasperformingarts.org/event/stomp-2026-bass-concert-hall-austin-texas/
  const match = url.match(/\/event\/([^/]+)\/?$/);
  if (match) {
    return `tpa-${match[1]}`;
  }
  
  // Fallback to full URL slug
  const slug = url.replace(/https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  return `tpa-${slug}`.substring(0, 100);
}

/**
 * Infer category from TPA presenter/series
 */
function inferTPACategory(presenter: string, title: string): EventCategory {
  const presenterLower = presenter.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Broadway in Austin -> THEATER
  if (presenterLower.includes('broadway')) {
    return EventCategory.THEATER;
  }
  
  // Dance performances
  if (titleLower.includes('dance') || titleLower.includes('ballet')) {
    return EventCategory.THEATER;
  }
  
  // Film screenings
  if (titleLower.includes('in concert') || titleLower.includes('screening') || 
      titleLower.includes('film') || titleLower.includes('movie')) {
    return EventCategory.MOVIE;
  }
  
  // Comedy/conversation shows
  if (titleLower.includes('conversation') || titleLower.includes('trivia')) {
    return EventCategory.COMEDY;
  }
  
  // Circus/performance art
  if (titleLower.includes('cirque') || titleLower.includes('circus')) {
    return EventCategory.THEATER;
  }
  
  // Music (orchestras, concerts, etc.)
  if (titleLower.includes('orchestra') || titleLower.includes('symphony') ||
      titleLower.includes('quartet') || titleLower.includes('brass') ||
      presenterLower.includes('music')) {
    return EventCategory.CONCERT;
  }
  
  // Default to THEATER for TPA (most common)
  return EventCategory.THEATER;
}

