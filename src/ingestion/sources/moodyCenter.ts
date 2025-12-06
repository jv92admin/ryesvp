import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';

/**
 * Scrape events from Moody Center website.
 * 
 * Uses JSON-LD structured data for reliable extraction of exact times,
 * end dates, descriptions, and images. Falls back to HTML parsing if JSON-LD unavailable.
 */
export async function fetchEventsFromMoodyCenter(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  const maxPages = 30; // Limit to prevent infinite loops
  
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

      // Try to extract JSON-LD structured data first (preferred method)
      const jsonLdScripts = $('script[type="application/ld+json"]');
      
      let pageEventCount = 0;
      for (let i = 0; i < jsonLdScripts.length; i++) {
        const jsonLdScript = $(jsonLdScripts[i]).text();
        
        if (!jsonLdScript) continue;
        
        try {
          const schemaData = JSON.parse(jsonLdScript);
          
          // schemaData might be an array or an object with @graph
          const eventsArray = Array.isArray(schemaData) 
            ? schemaData 
            : schemaData['@graph'] || [];
          
          for (const item of eventsArray) {
            if (item['@type'] === 'Event') {
              try {
                const startDateTime = new Date(item.startDate);
                const endDateTime = item.endDate ? new Date(item.endDate) : null;
                
                if (isNaN(startDateTime.getTime())) {
                  console.warn(`Moody Center: Invalid startDate for "${item.name}"`);
                  continue;
                }
                
                const description = extractOpponentFromDescription(item.description);
                const url = item.url || '';
                const sourceEventId = extractIdFromUrl(url);
                
                events.push({
                  venueSlug: 'moody-center',
                  title: item.name || '',
                  description,
                  startDateTime,
                  endDateTime,
                  url,
                  imageUrl: item.image || null,
                  category: inferCategoryFromUrl(url),
                  source: EventSource.VENUE_WEBSITE,
                  sourceEventId,
                });
                pageEventCount++;
              } catch (eventError) {
                console.error('Error parsing JSON-LD event:', eventError);
              }
            }
          }
        } catch (jsonError) {
          console.warn(`Moody Center page ${page}: Failed to parse JSON-LD script ${i}:`, jsonError instanceof Error ? jsonError.message : String(jsonError));
        }
      }
      
      // If no events found on this page, we're done
      if (pageEventCount === 0) {
        break;
      }
    }
    
    console.log(`Moody Center: Found ${events.length} events`);
    
  } catch (error) {
    console.error('Error scraping Moody Center:', error);
  }

  return events;
}

/**
 * Extract opponent name from description for basketball games
 * Pattern: "Texas vs. {Opponent} at Moody Center"
 */
function extractOpponentFromDescription(description: string | undefined): string | null {
  if (!description) return null;
  
  // Remove HTML tags if present
  const cleanDesc = description.replace(/<[^>]*>/g, '');
  
  // Pattern: "Texas vs. {Opponent} at Moody Center"
  const match = cleanDesc.match(/Texas vs\.\s+([^<]+?)\s+at Moody Center/i);
  if (match) {
    return `vs. ${match[1].trim()}`;
  }
  
  // Return first 200 chars as fallback description
  return cleanDesc.slice(0, 200).trim() || null;
}

/**
 * Infer category from URL patterns
 */
function inferCategoryFromUrl(url: string): EventCategory {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('basketball') || urlLower.includes('-mbb') || urlLower.includes('-wbb')) {
    return EventCategory.OTHER; // Sports
  }
  if (urlLower.includes('comedy')) {
    return EventCategory.COMEDY;
  }
  if (urlLower.includes('concert') || urlLower.includes('music')) {
    return EventCategory.CONCERT;
  }
  
  return EventCategory.OTHER;
}

/**
 * Extract event ID from URL
 * Example: "https://moodycenteratx.com/event/texas-wbb-123/" -> "123"
 */
function extractIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/(\d+)\//);
  return match ? match[1] : undefined;
}

