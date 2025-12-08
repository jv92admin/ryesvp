import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { launchBrowser } from '@/lib/browser';

/**
 * Scrape events from H-E-B Center at Cedar Park website using the CALENDAR view.
 * 
 * HEB Center hosts Texas Stars (AHL hockey), Austin Spurs (G League basketball),
 * and various concerts/shows. The calendar view shows all events per month
 * without pagination issues.
 * 
 * URL: https://www.hebcenter.com/events/calendar
 */
export async function fetchEventsFromHEBCenter(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    console.log('HEB Center: Starting calendar scraper...');
    
    browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Go to calendar view - much better than the events list
    await page.goto('https://www.hebcenter.com/events/calendar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for calendar to load
    console.log('HEB Center: Waiting for calendar to load...');
    try {
      await page.waitForSelector('.tl-calendar', { timeout: 10000 });
    } catch {
      console.log('HEB Center: Calendar selector not found, page may not have loaded');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const seenUrls = new Set<string>();
    
    // Scrape multiple months (current + next 6 months)
    const monthsToScrape = 7;
    
    for (let monthIndex = 0; monthIndex < monthsToScrape; monthIndex++) {
      const monthName = await page.$eval('.month_name', el => el.textContent?.trim() || '');
      console.log(`HEB Center: Scraping ${monthName}...`);
      
      const html = await page.content();
      const $ = load(html);
      
      // Find all days with events
      const eventDays = $('.tl-date.hasEvent').toArray();
      
      for (const dayEl of eventDays) {
        const $day = $(dayEl);
        const fullDate = $day.attr('data-fulldate'); // e.g., "01-02-2026"
        
        // Find all events in this day
        const eventWrappers = $day.find('.event_item_wrapper').toArray();
        
        for (const wrapper of eventWrappers) {
          try {
            const $wrapper = $(wrapper);
            
            // Extract title and URL
            const titleLink = $wrapper.find('h3 a').first();
            const title = titleLink.text().trim();
            const eventUrl = titleLink.attr('href') || '';
            
            if (!title || !eventUrl) continue;
            
            // Deduplicate by URL
            if (seenUrls.has(eventUrl)) continue;
            seenUrls.add(eventUrl);
            
            // Extract date and time from the entry
            const dateSpan = $wrapper.find('.date .dt').text().trim(); // e.g., "Jan 2, 2026 - "
            const timeSpan = $wrapper.find('.date .time').text().trim(); // e.g., "7:00 PM" or "@ TBA"
            
            const startDateTime = parseCalendarDate(fullDate, dateSpan, timeSpan);
            
            if (!startDateTime) {
              console.log(`HEB Center: Skipping event with invalid date: ${title}`);
              continue;
            }
            
            // Skip past events
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventDate = new Date(startDateTime);
            eventDate.setHours(0, 0, 0, 0);
            if (eventDate < today) continue;
            
            // Extract image URL
            const imageUrl = $wrapper.find('.thumb img').attr('src') || null;
            
            // Create external ID from URL slug
            const urlSlug = eventUrl.split('/').filter(Boolean).pop() || '';
            
            // Determine category based on title
            const category = categorizeHEBEvent(title);
            
            events.push({
              sourceEventId: `heb-center-${urlSlug}`,
              title,
              startDateTime,
              endDateTime: null,
              url: eventUrl,
              imageUrl,
              description: null,
              source: EventSource.VENUE_WEBSITE,
              category,
              venueSlug: 'heb-center',
            });
            
          } catch (err) {
            console.error('HEB Center: Error parsing calendar event:', err);
          }
        }
      }
      
      // Navigate to next month (if not the last iteration)
      if (monthIndex < monthsToScrape - 1) {
        try {
          await page.click('.cal-next');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch {
          console.log('HEB Center: Could not navigate to next month');
          break;
        }
      }
    }
    
    console.log(`HEB Center: Successfully parsed ${events.length} events`);
    return events;
    
  } catch (error) {
    console.error('Error scraping HEB Center:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Parse calendar date from data-fulldate attribute and time span
 * fullDate format: "MM-DD-YYYY" (e.g., "01-02-2026")
 * timeStr format: "7:00 PM" or "@ TBA"
 */
function parseCalendarDate(fullDate: string | undefined, dateSpan: string, timeStr: string): Date | null {
  // Try to get date from data-fulldate attribute first
  if (fullDate) {
    const parts = fullDate.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1; // 0-indexed
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Parse time
      const { hours, minutes } = parseTime(timeStr);
      
      return new Date(year, month, day, hours, minutes, 0);
    }
  }
  
  // Fallback: parse from dateSpan (e.g., "Jan 2, 2026 - ")
  if (dateSpan) {
    // Remove trailing " - " or similar
    const cleanDate = dateSpan.replace(/\s*-\s*$/, '').trim();
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      const { hours, minutes } = parseTime(timeStr);
      parsed.setHours(hours, minutes, 0, 0);
      return parsed;
    }
  }
  
  return null;
}

/**
 * Parse time string like "7:00 PM" or "@ TBA"
 * Returns { hours, minutes } in 24-hour format
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  // Default to 7 PM if TBA or unparseable
  let hours = 19;
  let minutes = 0;
  
  if (timeStr && !timeStr.includes('TBA')) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const period = timeMatch[3]?.toUpperCase();
      
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  }
  
  return { hours, minutes };
}

/**
 * Categorize HEB Center events based on title keywords
 */
function categorizeHEBEvent(title: string): EventCategory {
  const lowerTitle = title.toLowerCase();
  
  // Sports teams
  if (lowerTitle.includes('stars') || lowerTitle.includes('spurs') || 
      lowerTitle.includes('vs') || lowerTitle.includes('lovb') ||
      lowerTitle.includes('hockey') || lowerTitle.includes('basketball') ||
      lowerTitle.includes('reign') || lowerTitle.includes('admirals') ||
      lowerTitle.includes('firebirds') || lowerTitle.includes('barracuda')) {
    return EventCategory.SPORTS;
  }
  
  // Wrestling/AEW
  if (lowerTitle.includes('aew') || lowerTitle.includes('wrestling') ||
      lowerTitle.includes('dynamite') || lowerTitle.includes('wwe')) {
    return EventCategory.SPORTS;
  }
  
  // Family/kids shows
  if (lowerTitle.includes('cirque') || lowerTitle.includes('disney') ||
      lowerTitle.includes('sesame') || lowerTitle.includes('paw patrol') ||
      lowerTitle.includes('graduation')) {
    return EventCategory.OTHER;
  }
  
  // Comedy
  if (lowerTitle.includes('comedy') || lowerTitle.includes('comedian')) {
    return EventCategory.COMEDY;
  }
  
  // Default to concert/music
  return EventCategory.CONCERT;
}

