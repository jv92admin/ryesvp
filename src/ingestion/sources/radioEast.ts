/**
 * Radio East (Radio Coffee & Beer) Event Scraper
 * 
 * URL: https://radio-coffee-beer.webflow.io/radio-east#events
 * 
 * Structure:
 * - Uses DICE widget for event listings
 * - Events have JSON-LD embedded in script tags
 * - Has "Load more" button to paginate
 * - JSON-LD contains @type: "MusicEvent" with full event data
 */

import { launchBrowser } from '@/lib/browser';
import * as cheerio from 'cheerio';
import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { inferCategory } from '../utils/dateParser';

const RADIO_EAST_URL = 'https://radio-coffee-beer.webflow.io/radio-east#events';

export async function fetchEventsFromRadioEast(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  
  console.log("Radio East: Starting scraper...");
  
  const browser = await launchBrowser();
  
  try {
    const page = await browser.newPage();
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to events page
    await page.goto(RADIO_EAST_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    
    // Wait for DICE widget to load
    console.log("Radio East: Waiting for DICE widget to load...");
    await page.waitForSelector('#dice-event-list-widget', { timeout: 30000 }).catch(() => {
      console.log("Radio East: DICE widget selector not found, continuing...");
    });
    
    // Wait for articles to appear (events are in article elements)
    await page.waitForSelector('article', { timeout: 15000 }).catch(() => {
      console.log("Radio East: No article elements found");
    });
    
    // Give extra time for events to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    
    // Click "Load more" button repeatedly to get all events
    let loadMoreClicks = 0;
    const maxClicks = 10;
    
    while (loadMoreClicks < maxClicks) {
      try {
        const loadMoreButton = await page.$('.dice_load-more');
        if (!loadMoreButton) {
          console.log("Radio East: No more 'Load more' button found");
          break;
        }
        
        // Check if button is visible/clickable
        const isVisible = await loadMoreButton.isVisible();
        if (!isVisible) {
          console.log("Radio East: 'Load more' button not visible");
          break;
        }
        
        await loadMoreButton.click();
        loadMoreClicks++;
        console.log(`Radio East: Clicked 'Load more' (${loadMoreClicks})`);
        
        // Wait for new events to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log("Radio East: Finished loading all events");
        break;
      }
    }
    
    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);
    
    console.log("Radio East: Page title:", $('title').text());
    
    // Extract JSON-LD from each article
    console.log("Radio East: Extracting events from JSON-LD...");
    
    const seenIds = new Set<string>();
    
    $('script[type="application/ld+json"]').each((idx, el) => {
      try {
        const jsonText = $(el).html();
        if (!jsonText) return;
        
        const data = JSON.parse(jsonText);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Event' || item['@type'] === 'MusicEvent') {
            const startDate = new Date(item.startDate);
            
            // Skip invalid dates
            if (isNaN(startDate.getTime())) {
              continue;
            }
            
            // Skip past events (but allow today's events)
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start of today
            if (startDate < now) {
              continue;
            }
            
            // Generate event ID from URL or name+date
            const sourceEventId = item.url 
              ? item.url.split('/').pop()?.split('?')[0] || ''
              : `${item.name}-${item.startDate}`.replace(/\s+/g, '-').toLowerCase();
            
            // Skip duplicates
            if (seenIds.has(sourceEventId)) {
              continue;
            }
            seenIds.add(sourceEventId);
            
            // Get image URL
            let imageUrl: string | undefined;
            if (item.image) {
              imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
              // Clean up DICE image URLs
              if (imageUrl && imageUrl.includes('?')) {
                imageUrl = imageUrl.split('?')[0];
              }
            }
            
            // Get price from offers
            let priceInfo: string | undefined;
            if (item.offers && item.offers.length > 0) {
              const price = item.offers[0].price;
              if (price === 0) {
                priceInfo = 'Free';
              } else if (price) {
                priceInfo = `$${price}`;
              }
            }
            
            const event: NormalizedEvent = {
              title: item.name,
              startDateTime: startDate,
              venueSlug: 'radio-east',
              source: EventSource.VENUE_WEBSITE,
              sourceEventId,
              url: item.url || RADIO_EAST_URL,
              imageUrl,
              category: inferCategory(item.name || '') as EventCategory,
              description: item.description,
            };
            
            events.push(event);
          }
        }
      } catch (e) {
        console.error("Radio East: Error processing JSON-LD:", e);
      }
    });
    
    console.log(`Radio East: Extracted ${events.length} events`);
    
  } finally {
    await browser.close();
  }
  
  // Sort by date
  events.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  
  return events;
}

