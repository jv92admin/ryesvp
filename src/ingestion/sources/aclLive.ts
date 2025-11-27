import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Scrape events from ACL Live website.
 * 
 * ACL Live has two venues:
 * - ACL Live at The Moody Theater (main venue)
 * - ACL Live at 3TEN (smaller venue, formerly known as 3TEN ACL Live)
 * 
 * Both are scraped under the 'acl-live' slug with venue details in description.
 * Uses Puppeteer for infinite scroll handling.
 */
export async function fetchEventsFromAclLive(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });
    
    // Set user agent to avoid blocks
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to events calendar page
    await page.goto('https://www.acllive.com/calendar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for initial events to load
    try {
      await page.waitForSelector('.eventItem', { timeout: 15000 });
      console.log('ACL Live: Found initial event items');
    } catch (e) {
      console.warn('ACL Live: Event items not found, page may not have loaded');
      return events;
    }
    
    // Auto-scroll to load all events from infinite scroll
    let previousEventCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Prevent infinite loops
    
    while (scrollAttempts < maxScrollAttempts) {
      // Count current events
      const currentEventCount = await page.$$eval('.eventItem', items => items.length);
      
      console.log(`ACL Live: Scroll attempt ${scrollAttempts + 1}, found ${currentEventCount} events`);
      
      // If no new events loaded after scrolling, we're done
      if (currentEventCount === previousEventCount && scrollAttempts > 0) {
        console.log('ACL Live: No new events loaded, stopping scroll');
        break;
      }
      
      previousEventCount = currentEventCount;
      
      // Scroll to bottom of page
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for potential new content to load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      scrollAttempts++;
    }
    
    // Get final rendered HTML
    const html = await page.content();
    const $ = load(html);

    // Find all event items
    const eventItems = $('.eventItem').toArray();
    console.log(`ACL Live: Found ${eventItems.length} total event items after scrolling`);

    for (const item of eventItems) {
      try {
        const $item = $(item);

        // Get title from the title link
        const titleLink = $item.find('.title a').first();
        const title = titleLink.text().trim();
        const eventUrl = titleLink.attr('href') || '';

        // Skip template strings that weren't rendered
        if (!title || title.includes('{{') || title.includes('decodeURI')) {
          continue;
        }

        // Get date parts
        const month = $item.find('.m-date__month').first().text().trim();
        const day = $item.find('.m-date__day').first().text().trim();
        const year = $item.find('.m-date__year').first().text().trim().replace(',', '');

        // Parse the date
        const startDateTime = parseAclLiveDate(month, day, year, eventUrl);
        
        if (!startDateTime || isNaN(startDateTime.getTime())) {
          console.log(`ACL Live: Could not parse date for "${title}": ${month} ${day} ${year}`);
          continue;
        }

        // Get venue/location (ACL Live at The Moody Theater or ACL Live at 3TEN)
        const location = $item.find('.location').first().text().trim();
        
        // Get image URL
        let imageUrl = $item.find('.thumb img').first().attr('src') || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://www.acllive.com${imageUrl}`;
        }

        // Get presenter if available
        const presentedBy = $item.find('.presented-by').first().text().trim();
        
        // Get tour name if available
        const tour = $item.find('.tour').first().text().trim();
        
        // Get tagline/support act if available
        const tagline = $item.find('.tagline').first().text().trim();

        // Build description from available info
        const descriptionParts: string[] = [];
        if (location) descriptionParts.push(`Venue: ${location}`);
        if (tour) descriptionParts.push(`Tour: ${tour}`);
        if (tagline) descriptionParts.push(tagline);
        if (presentedBy) descriptionParts.push(`Presented by: ${presentedBy}`);
        
        const description = descriptionParts.length > 0 ? descriptionParts.join(' | ') : null;

        // Extract source event ID from URL
        const sourceEventId = extractEventIdFromUrl(eventUrl);

        // Infer category from title and content
        const category = inferEventCategory(title, tagline, tour);

        events.push({
          venueSlug: 'acl-live',
          title,
          description,
          startDateTime,
          endDateTime: null,
          url: eventUrl,
          imageUrl,
          category,
          source: EventSource.VENUE_WEBSITE,
          sourceEventId,
        });

      } catch (error) {
        console.error('ACL Live: Error parsing event item:', error);
      }
    }

    console.log(`ACL Live: Extracted ${events.length} events`);

  } catch (error) {
    console.error('Error scraping ACL Live:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return events;
}

/**
 * Parse ACL Live date format
 * Month: "Nov ", "Dec " (with trailing space)
 * Day: "28", " 5" (may have leading space)
 * Year: "2025" or ", 2025"
 * URL may contain time: "at-8-pm"
 */
function parseAclLiveDate(month: string, day: string, year: string, url: string): Date | null {
  try {
    // Clean up the parts
    const cleanMonth = month.trim();
    const cleanDay = day.trim();
    const cleanYear = year.trim().replace(/^,\s*/, '');

    // Map month abbreviations
    const monthMap: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    };

    const monthNum = monthMap[cleanMonth.toLowerCase().slice(0, 3)];
    if (monthNum === undefined) {
      return null;
    }

    const dayNum = parseInt(cleanDay, 10);
    const yearNum = parseInt(cleanYear, 10) || new Date().getFullYear();

    // Try to extract time from URL (e.g., "at-8-pm", "at-7-30-pm")
    const timeMatch = url.match(/at-(\d+)(?:-(\d+))?-(am|pm)/i);
    let hour = 20; // Default to 8 PM
    let minute = 0;

    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      
      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
    }

    return new Date(yearNum, monthNum, dayNum, hour, minute);

  } catch (error) {
    console.error('ACL Live: Error parsing date:', error);
    return null;
  }
}

/**
 * Extract a unique event ID from the URL
 * Example: "https://www.acllive.com/event/2025-11-28-bob-schneider-the-moonlight-orchestra-at-8-pm"
 * Returns: "2025-11-28-bob-schneider-the-moonlight-orchestra-at-8-pm"
 */
function extractEventIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/event\/([^/]+)/);
  return match ? match[1] : undefined;
}

/**
 * Infer event category from title and supporting text
 */
function inferEventCategory(title: string, tagline: string, tour: string): EventCategory {
  const searchText = `${title} ${tagline} ${tour}`.toLowerCase();
  
  // Comedy indicators
  if (
    searchText.includes('comedy') ||
    searchText.includes('stand-up') ||
    searchText.includes('comedian') ||
    searchText.includes('laugh')
  ) {
    return EventCategory.COMEDY;
  }

  // Theater/musical indicators
  if (
    searchText.includes('theater') ||
    searchText.includes('theatre') ||
    searchText.includes('musical') ||
    searchText.includes('broadway')
  ) {
    return EventCategory.THEATER;
  }

  // Most ACL Live events are concerts
  return EventCategory.CONCERT;
}
