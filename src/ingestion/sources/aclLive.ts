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
    
    // ACL Live uses infinite scroll with loading spinner + hidden "Load More" button
    // Strategy: scroll → wait for spinner → if stuck, click hidden button → repeat
    let previousEventCount = 0;
    let scrollAttempts = 0;
    let consecutiveNoChange = 0;
    const maxScrollAttempts = 50;
    const maxConsecutiveNoChange = 3;
    
    while (scrollAttempts < maxScrollAttempts) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for loading spinner (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Count events
      const currentEventCount = await page.$$eval('.eventItem', items => items.length);
      
      // Get last event date for progress tracking
      const lastEventDate = await page.$$eval('.eventItem', items => {
        if (items.length === 0) return 'none';
        const last = items[items.length - 1];
        const month = last.querySelector('.m-date__month')?.textContent?.trim() || '';
        const day = last.querySelector('.m-date__day')?.textContent?.trim() || '';
        const year = last.querySelector('.m-date__year')?.textContent?.trim() || '';
        return `${month} ${day} ${year}`;
      });
      
      scrollAttempts++;
      console.log(`ACL Live: Scroll ${scrollAttempts} | Events: ${currentEventCount} | Last: ${lastEventDate}`);
      
      // Check progress
      if (currentEventCount > previousEventCount) {
        consecutiveNoChange = 0;
        previousEventCount = currentEventCount;
      } else {
        consecutiveNoChange++;
        
        // When scroll stops working, try clicking hidden "Load More" button
        const loadMoreBtn = await page.$('#loadMoreEvents');
        if (loadMoreBtn) {
          console.log(`ACL Live: Scroll stuck, clicking hidden Load More button...`);
          try {
            await page.evaluate(() => {
              const btn = document.querySelector('#loadMoreEvents') as HTMLElement;
              if (btn) btn.click();
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const newCount = await page.$$eval('.eventItem', items => items.length);
            if (newCount > currentEventCount) {
              console.log(`ACL Live: Button worked! ${currentEventCount} → ${newCount}`);
              consecutiveNoChange = 0;
              previousEventCount = newCount;
              continue;
            }
          } catch (e) {
            // Button click failed, continue
          }
        }
        
        if (consecutiveNoChange >= maxConsecutiveNoChange) {
          console.log('ACL Live: Reached end of events');
          break;
        }
      }
    }
    
    console.log(`ACL Live: Done after ${scrollAttempts} scrolls, ${previousEventCount} total events`);
    
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

        // Get date parts - try structured spans first, fall back to raw text
        let month = $item.find('.m-date__month').first().text().trim();
        let day = $item.find('.m-date__day').first().text().trim();
        let year = $item.find('.m-date__year').first().text().trim().replace(',', '');

        let startDateTime: Date | null = null;
        
        // If structured date elements exist, use them
        if (month && day) {
          startDateTime = parseAclLiveDate(month, day, year, eventUrl);
        }
        
        // Fall back to parsing raw date text for edge cases like:
        // "DECEMBER 12 & 14, 2025" or "THURSDAY APRIL 2, 2026"
        if (!startDateTime || isNaN(startDateTime.getTime())) {
          const rawDateText = $item.find('.date a').first().text().trim();
          startDateTime = parseRawDateText(rawDateText, eventUrl);
        }
        
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
 * Parse raw date text for edge cases like:
 * - "DECEMBER 12 & 14, 2025" (multi-day event, use first date)
 * - "THURSDAY APRIL 2, 2026" (day name prefix)
 */
function parseRawDateText(rawText: string, url: string): Date | null {
  if (!rawText) return null;
  
  const monthMap: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
  };

  try {
    // Normalize: uppercase to title case, remove extra whitespace
    const text = rawText.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // Pattern: "MONTH DAY, YEAR" or "MONTH DAY & DAY, YEAR" or "DAYNAME MONTH DAY, YEAR"
    // Examples: "DECEMBER 12 & 14, 2025", "THURSDAY APRIL 2, 2026"
    
    // Extract year (4 digits at end)
    const yearMatch = text.match(/(\d{4})\s*$/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    
    // Find month name
    let month: number | null = null;
    for (const [name, num] of Object.entries(monthMap)) {
      if (text.includes(name.toUpperCase())) {
        month = num;
        break;
      }
    }
    
    if (month === null) return null;
    
    // Extract first day number after month name
    const dayMatch = text.match(/[A-Z]+\s+(\d{1,2})/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : null;
    
    if (!day) return null;
    
    // Try to extract time from URL
    const timeMatch = url.match(/at-(\d+)(?:-(\d+))?-(am|pm)/i);
    let hour = 20; // Default to 8 PM
    let minute = 0;
    
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      if (isPM && hour !== 12) hour += 12;
      else if (!isPM && hour === 12) hour = 0;
    }
    
    return new Date(year, month, day, hour, minute);
    
  } catch (error) {
    console.error('ACL Live: Error parsing raw date text:', rawText, error);
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
