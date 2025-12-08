import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { launchBrowser } from '@/lib/browser';
import { createAustinDate } from '@/lib/utils';

/**
 * Scrape events from Empire Garage & Control Room website.
 * 
 * Empire uses the Modern Events Calendar (MEC) WordPress plugin.
 * Events load via a carousel widget with a "Load More" button.
 * 
 * URL: https://empireatx.com/
 */
export async function fetchEventsFromEmpire(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    console.log('Empire: Starting scraper...');
    
    browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto('https://empireatx.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for events to load
    console.log('Empire: Waiting for events to load...');
    try {
      await page.waitForSelector('.mec-event-article', { timeout: 10000 });
    } catch {
      console.log('Empire: Events selector not found, page may not have loaded');
    }
    
    // Extra time for widget to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "Load More" button repeatedly until no more events
    let previousCount = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      const currentCount = await page.$$eval('.mec-event-article', items => items.length);
      console.log(`Empire: Attempt ${attempt + 1} - ${currentCount} events`);
      
      if (currentCount === previousCount && attempt > 0) {
        console.log('Empire: No new events, done loading');
        break;
      }
      previousCount = currentCount;
      
      // Click the "Load More" button
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('.mec-load-more-button');
        if (btn && btn.textContent?.includes('Load More')) {
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });
      
      if (!clicked) {
        console.log('Empire: No more button found, done');
        break;
      }
      
      // Wait for new events to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const html = await page.content();
    const $ = load(html);
    
    // Find all event articles
    const eventItems = $('article.mec-event-article').toArray();
    console.log(`Empire: Found ${eventItems.length} event articles`);
    
    const seenIds = new Set<string>();
    
    for (const item of eventItems) {
      try {
        const $item = $(item);
        
        // Extract title and URL from the title link
        const titleLink = $item.find('.mec-event-title a, h4 a[data-event-id], h3 a[data-event-id]').first();
        const title = titleLink.text().trim();
        const eventUrl = titleLink.attr('href') || '';
        const eventId = titleLink.attr('data-event-id') || '';
        
        if (!title || !eventUrl) {
          continue;
        }
        
        // Deduplicate by event ID
        if (eventId && seenIds.has(eventId)) {
          continue;
        }
        if (eventId) {
          seenIds.add(eventId);
        }
        
        // Extract date from start date label
        // Format: "09 December" or "09 Dec"
        const dateStr = $item.find('.mec-start-date-label').text().trim();
        const startDateTime = parseEmpireDate(dateStr);
        
        if (!startDateTime) {
          console.log(`Empire: Skipping event with invalid date: ${title}`);
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
        
        // Extract image URL
        const imageUrl = $item.find('.mec-event-image img').attr('src') || null;
        
        // Create external ID from event ID or URL slug
        const eventSlug = eventId || eventUrl.split('/').filter(Boolean).pop() || '';
        
        events.push({
          sourceEventId: `empire-${eventSlug}`,
          title,
          startDateTime,
          endDateTime: null,
          url: eventUrl,
          imageUrl,
          description: null,
          source: EventSource.VENUE_WEBSITE,
          category: EventCategory.CONCERT,
          venueSlug: 'empire-control-room',
        });
        
      } catch (err) {
        console.error('Empire: Error parsing event item:', err);
      }
    }
    
    console.log(`Empire: Successfully parsed ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error('Error scraping Empire:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Parse Empire date format: "09 December" or "09 Dec"
 * Returns Date object or null if invalid
 */
function parseEmpireDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Parse "DD Month" or "DD Mon" format
  const match = dateStr.match(/(\d{1,2})\s+(\w+)/);
  if (!match) return null;
  
  const day = parseInt(match[1], 10);
  const monthStr = match[2].toLowerCase();
  
  const monthMap: Record<string, number> = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11,
  };
  
  const month = monthMap[monthStr];
  if (month === undefined) return null;
  
  // Determine year - if the date has passed this year, use next year
  const now = new Date();
  let year = now.getFullYear();
  
  const candidateDate = new Date(year, month, day);
  if (candidateDate < now) {
    // Check if it's more than 2 months in the past (probably next year)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (candidateDate < twoMonthsAgo) {
      year++;
    }
  }
  
  // Default time to 8 PM for concerts - create in Austin timezone
  return createAustinDate(year, month, day, 20, 0);
}

