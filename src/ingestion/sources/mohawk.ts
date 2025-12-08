import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { launchBrowser } from '@/lib/browser';
import { createAustinDate } from '@/lib/utils';

/**
 * Scrape events from Mohawk Austin website.
 * 
 * Mohawk loads events via JavaScript widget, so we need Puppeteer.
 * 
 * URL: https://mohawkaustin.com/
 */
export async function fetchEventsFromMohawk(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    console.log('Mohawk: Starting scraper...');
    
    browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto('https://mohawkaustin.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for events widget to load
    console.log('Mohawk: Waiting for events to load...');
    try {
      await page.waitForSelector('.list-view-item', { timeout: 10000 });
    } catch {
      console.log('Mohawk: Events selector not found, page may not have loaded');
    }
    
    // Extra time for widget to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "show me more" button repeatedly until no more events
    let previousCount = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const currentCount = await page.$$eval('.list-view-item', items => items.length);
      console.log(`Mohawk: Attempt ${attempt + 1} - ${currentCount} events`);
      
      if (currentCount === previousCount && attempt > 0) {
        console.log('Mohawk: No new events, done loading');
        break;
      }
      previousCount = currentCount;
      
      // Click the "show me more" button
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('#more-view > span') || 
                    document.querySelector('.more-button');
        if (btn) {
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });
      
      if (!clicked) {
        console.log('Mohawk: No more button found, done');
        break;
      }
      
      // Wait for new events to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const html = await page.content();
    const $ = load(html);
    
    // Find all event items
    const eventItems = $('.list-view-item').toArray();
    console.log(`Mohawk: Found ${eventItems.length} event items`);
    
    for (const item of eventItems) {
      try {
        const $item = $(item);
        
        // Extract date parts
        const month = $item.find('.month').text().trim();
        const dayOfMonth = $item.find('.dayofmonth').text().trim();
        const dayOfWeek = $item.find('.day-of-week').text().trim();
        
        // Extract time and venue from endtop (e.g., "7pm / Indoor / All Ages")
        const endtop = $item.find('.endtop').text().trim();
        const [timeStr] = endtop.split('/').map(s => s.trim());
        
        // Extract event details
        const titleEl = $item.find('.event-name.headliners a').first();
        const title = titleEl.text().trim();
        const eventUrl = titleEl.attr('href') || '';
        
        // Extract support acts
        const supports = $item.find('.supports a').text().trim();
        
        // Extract image
        const imageUrl = $item.find('.image-url img').attr('src') || undefined;
        
        // Extract presenter
        const presenter = $item.find('.toptop').text().trim();
        
        // Skip if no title
        if (!title) continue;
        
        // Parse date
        const startDateTime = parseMohawkDate(month, dayOfMonth, timeStr);
        
        if (!startDateTime || isNaN(startDateTime.getTime())) {
          console.log(`Mohawk: Could not parse date for "${title}": ${month} ${dayOfMonth} ${timeStr}`);
          continue;
        }
        
        // Skip past events
        if (startDateTime < new Date()) {
          continue;
        }
        
        // Extract event ID from URL
        const sourceEventId = extractEventId(eventUrl);
        
        // Build full title with support acts if present
        const fullTitle = supports && supports.trim() && supports !== title 
          ? `${title}` 
          : title;
        
        events.push({
          title: fullTitle,
          startDateTime,
          venueSlug: 'mohawk',
          source: EventSource.VENUE_WEBSITE,
          sourceEventId,
          url: eventUrl.startsWith('http') ? eventUrl : `https://mohawkaustin.com${eventUrl}`,
          imageUrl,
          category: inferCategory(title, presenter),
        });
        
      } catch (error) {
        console.error('Mohawk: Error parsing event item:', error);
      }
    }
    
    console.log(`Mohawk: Extracted ${events.length} events`);
    
  } catch (error) {
    console.error('Error scraping Mohawk:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return events;
}

/**
 * Parse Mohawk date format
 * Month: "DEC", "JAN", etc.
 * Day: "7", "14", etc.
 * Time: "7pm", "8pm", "10pm", etc.
 */
function parseMohawkDate(month: string, day: string, time: string): Date | null {
  try {
    const monthMap: Record<string, number> = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
    };
    
    const monthNum = monthMap[month.toUpperCase()];
    if (monthNum === undefined) return null;
    
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) return null;
    
    // Parse time (e.g., "7pm", "10pm", "6:30pm")
    let hour = 20; // Default 8pm
    let minute = 0;
    
    const timeMatch = time.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPM = timeMatch[3]?.toLowerCase() === 'pm';
      
      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
    }
    
    // Determine year - if month is before current month, it's next year
    const now = new Date();
    let year = now.getFullYear();
    
    const testDate = new Date(year, monthNum, dayNum, hour, minute);
    if (testDate < now) {
      year++;
    }
    
    // Create date in Austin timezone
    return createAustinDate(year, monthNum, dayNum, hour, minute);
    
  } catch {
    return null;
  }
}

/**
 * Extract event ID from URL
 * Example: /event/?id=-2852852648592801188
 */
function extractEventId(url: string): string | undefined {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : undefined;
}

/**
 * Infer category from title and presenter
 */
function inferCategory(title: string, presenter: string): EventCategory {
  const text = `${title} ${presenter}`.toLowerCase();
  
  if (text.includes('comedy') || text.includes('quizzo') || text.includes('trivia')) {
    return EventCategory.OTHER;
  }
  
  if (text.includes('dj') || text.includes('dance party')) {
    return EventCategory.CONCERT;
  }
  
  // Default to concert for music venue
  return EventCategory.CONCERT;
}

