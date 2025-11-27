import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { parseMoodyCenterDate, inferCategory } from '../utils/dateParser';

/**
 * Scrape events from Moody Center website.
 * 
 * Moody Center uses The Events Calendar WordPress plugin and displays events
 * with pagination. Events are shown with dates in format "Sunday / Feb 1 / 2026"
 */
export async function fetchEventsFromMoodyCenter(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const maxPages = 10; // Limit to prevent infinite loops
  
  try {
    // Fetch pages until we find no more events
    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1 
        ? 'https://moodycenteratx.com/events/?hide_subsequent_recurrences=1'
        : `https://moodycenteratx.com/events/photo/page/${page}/?hide_subsequent_recurrences=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        if (response.status === 404 && page > 1) {
          // No more pages
          break;
        }
        console.warn(`Moody Center page ${page}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const $ = load(html);

      // Based on debug output: .event-title exists and contains titles
      // Dates are in format "Sunday / Nov 30 / 2025" in nearby elements
      // Find all elements that contain dates first, then match them with titles
      const allText = $('body').text();
      const dateMatches = Array.from(allText.matchAll(/(\w+day)\s*\/\s*(\w+\s+\d+)\s*\/\s*(\d{4})/g));
      
      if (dateMatches.length === 0) {
        // No dates found, no events on this page
        break;
      }

      // Find event titles (h3 a elements that aren't "Search Moody Center")
      const eventTitles = $('h3 a').filter((_, el) => {
        const text = $(el).text().trim();
        return Boolean(text && text !== 'Search Moody Center');
      });
      
      if (eventTitles.length === 0) {
        break;
      }

      // Match titles with dates - they appear to be in the same container/section
      eventTitles.each((index, titleElement) => {
        try {
          const $titleEl = $(titleElement);
          const title = $titleEl.text().trim();
          
          if (!title) return;
          
          // Find the parent section/container
          const $container = $titleEl.closest('article, section, li, [class*="event"], [class*="tribe"]').first();
          
          // Look for date in this container's text
          const containerText = $container.text();
          const dateMatch = containerText.match(/(\w+day)\s*\/\s*(\w+\s+\d+)\s*\/\s*(\d{4})/);
          
          let startDateTime: Date | null = null;
          if (dateMatch) {
            const dateStr = `${dateMatch[1]} / ${dateMatch[2]} / ${dateMatch[3]}`;
            startDateTime = parseMoodyCenterDate(dateStr);
          }
          
          // If no date in container, try to match by index with dateMatches
          if (!startDateTime && dateMatches[index]) {
            const match = dateMatches[index];
            const dateStr = `${match[1]} / ${match[2]} / ${match[3]}`;
            startDateTime = parseMoodyCenterDate(dateStr);
          }
          
          if (!startDateTime || isNaN(startDateTime.getTime())) {
            console.warn(`Moody Center: Could not parse date for "${title}"`);
            return;
          }
          
          // Extract URL
          const relativeUrl = $titleEl.attr('href') || '';
          const url = relativeUrl.startsWith('http') 
            ? relativeUrl 
            : relativeUrl.startsWith('/')
            ? `https://moodycenteratx.com${relativeUrl}`
            : 'https://moodycenteratx.com/events';
          
          // Extract description
          const description = $container.find('p').not('.event-title').first().text().trim();
          
          // Extract image
          const imageEl = $container.find('img').first();
          const imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || null;
          const fullImageUrl = imageUrl && !imageUrl.startsWith('http') 
            ? imageUrl.startsWith('/')
              ? `https://moodycenteratx.com${imageUrl}`
              : `https://moodycenteratx.com/${imageUrl}`
            : imageUrl;
          
          // Infer category
          const category = inferCategory(title, description) as EventCategory;
          
          // Extract source event ID from URL
          const urlMatch = url.match(/\/(\d+)\//);
          const sourceEventId = urlMatch ? urlMatch[1] : undefined;
          
          events.push({
            venueSlug: 'moody-center',
            title,
            description: description || null,
            startDateTime,
            endDateTime: null,
            url,
            imageUrl: fullImageUrl,
            category,
            source: EventSource.VENUE_WEBSITE,
            sourceEventId,
          });
        } catch (error) {
          console.error('Error parsing Moody Center event:', error);
        }
      });
      
      // If we got fewer events than expected, we might be on the last page
      if (eventTitles.length < 10) {
        break;
      }
    }
    
    console.log(`Moody Center: Found ${events.length} events`);
    
  } catch (error) {
    console.error('Error scraping Moody Center:', error);
  }

  return events;
}

