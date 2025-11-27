import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { inferCategory } from '../utils/dateParser';
import puppeteer from 'puppeteer';

/**
 * Scrape events from Paramount Theatre website.
 * 
 * Paramount uses tickets.austintheatre.org with Tessitura ticketing system.
 * Events are in .tn-prod-list-item elements with performances in .tn-prod-list-item__perf-list-item
 */
export async function fetchEventsFromParamount(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  let browser;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to events page
    await page.goto('https://tickets.austintheatre.org/events', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for events to load - look for the actual event container
    try {
      await page.waitForSelector('.tn-prod-list-item', { timeout: 15000 });
      console.log('Paramount: Found event containers');
    } catch (e) {
      console.warn('Paramount: Event containers not found, page may not have loaded');
    }
    
    // Give it a bit more time for all events to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the rendered HTML
    const html = await page.content();
    const $ = load(html);
    
    // Find all production items (each show/event)
    const productionItems = $('.tn-prod-list-item').toArray();
    console.log(`Paramount: Found ${productionItems.length} production items`);
    
    for (const prodItem of productionItems) {
      try {
        const $prod = $(prodItem);
        
        // Get production ID
        const prodSeasonNo = $prod.attr('data-tn-prod-season-no');
        
        // Get title from heading
        const titleEl = $prod.find('.tn-prod-list-item__property--heading a').first();
        const title = titleEl.text().trim();
        const prodUrl = titleEl.attr('href') || '';
        
        if (!title) {
          console.log('Paramount: Skipping item without title');
          continue;
        }
        
        // Get image
        const imageEl = $prod.find('.tn-prod-list-item__property--img-container img').first();
        let imageUrl = imageEl.attr('src') || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://tickets.austintheatre.org${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        
        // Get all performances for this production
        const perfItems = $prod.find('.tn-prod-list-item__perf-list-item').toArray();
        
        for (const perfItem of perfItems) {
          try {
            const $perf = $(perfItem);
            
            // Get performance ID
            const performanceNo = $perf.attr('data-tn-performance-no');
            
            // Get date and time
            const dateText = $perf.find('.tn-prod-list-item__perf-date').text().trim();
            const timeText = $perf.find('.tn-prod-list-item__perf-time').text().trim();
            
            if (!dateText) {
              console.log(`Paramount: Skipping performance without date for "${title}"`);
              continue;
            }
            
            // Parse the date
            const startDateTime = parseParamountDate(dateText, timeText);
            
            if (!startDateTime || isNaN(startDateTime.getTime())) {
              console.log(`Paramount: Could not parse date "${dateText} ${timeText}" for "${title}"`);
              continue;
            }
            
            // Get performance URL
            const perfAnchor = $perf.find('.tn-prod-list-item__perf-anchor');
            const perfUrl = perfAnchor.attr('href') || prodUrl;
            const fullUrl = perfUrl.startsWith('http') 
              ? perfUrl 
              : `https://tickets.austintheatre.org${perfUrl.startsWith('/') ? '' : '/'}${perfUrl}`;
            
            // Create unique source event ID from production + performance
            const sourceEventId = performanceNo || prodSeasonNo;
            
            // Extract product type ID and map to category
            const productTypeId = $perf.attr('data-tn-product-type-id');
            const category = mapProductTypeToCategory(productTypeId, title);
            
            events.push({
              venueSlug: 'paramount-theatre',
              title,
              description: null,
              startDateTime,
              endDateTime: null,
              url: fullUrl,
              imageUrl,
              category,
              source: EventSource.VENUE_WEBSITE,
              sourceEventId,
            });
            
          } catch (perfError) {
            console.error(`Error parsing performance for "${title}":`, perfError);
          }
        }
        
        // If no performances found, create event from production info
        if (perfItems.length === 0) {
          console.log(`Paramount: No performances found for "${title}", skipping`);
        }
        
      } catch (error) {
        console.error('Error parsing Paramount production:', error);
      }
    }
    
    console.log(`Paramount Theatre: Found ${events.length} events`);
    
  } catch (error) {
    console.error('Error scraping Paramount Theatre:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return events;
}

/**
 * Map Paramount product type ID to event category
 * Reference: notes/phase8-data-extraction-scope.md Section 2
 */
function mapProductTypeToCategory(productTypeId: string | undefined, title: string): EventCategory {
  const mapping: Record<string, EventCategory> = {
    '4': EventCategory.COMEDY,    // Comedy (from genre filter kid=4)
    '5': EventCategory.OTHER,      // Film (from "Elf Pub Run", "The Holiday")
    '13': EventCategory.CONCERT,   // Music (from genre filter kid=13)
    '19': EventCategory.CONCERT,   // Music (from "Marc Broussard")
    '20': EventCategory.OTHER,     // Special events (from "Home is Here", "Luna")
  };
  
  if (productTypeId && mapping[productTypeId]) {
    return mapping[productTypeId];
  }
  
  // Fallback to text inference if product type ID not in mapping
  return inferCategory(title, null) as EventCategory;
}

/**
 * Parse Paramount's date format: "Friday, November 28, 2025" + "7:00PM"
 */
function parseParamountDate(dateText: string, timeText: string): Date | null {
  try {
    // dateText: "Friday, November 28, 2025"
    // timeText: "7:00PM"
    
    // Remove day name if present
    const datePart = dateText.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*/i, '');
    
    // Combine date and time
    const fullDateStr = `${datePart} ${timeText}`.trim();
    
    // Try parsing with Date constructor
    const parsed = new Date(fullDateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Manual parsing as fallback
    // "November 28, 2025 7:00PM"
    const match = fullDateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})\s*(\d{1,2}):(\d{2})(AM|PM)?/i);
    if (match) {
      const [, month, day, year, hour, minute, ampm] = match;
      const months: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };
      
      let hourNum = parseInt(hour, 10);
      if (ampm?.toUpperCase() === 'PM' && hourNum !== 12) {
        hourNum += 12;
      } else if (ampm?.toUpperCase() === 'AM' && hourNum === 12) {
        hourNum = 0;
      }
      
      return new Date(
        parseInt(year, 10),
        months[month.toLowerCase()] ?? 0,
        parseInt(day, 10),
        hourNum,
        parseInt(minute, 10)
      );
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Paramount date:', error);
    return null;
  }
}
