/**
 * Long Center Scraper
 * 
 * Scrapes events from thelongcenter.org using embedded JSON-LD structured data.
 * The Long Center hosts events in Dell Hall, Rollins Studio Theatre, and the Terrace.
 */

import * as cheerio from 'cheerio';
import { EventSource } from '@prisma/client';
import { NormalizedEvent } from '../types';

const LONG_CENTER_URL = 'https://thelongcenter.org/events/';
const LONG_CENTER_DEFAULT_IMAGE = 'https://thelongcenter.org/wp-content/uploads/2020/09/Long-Center-OG-Image.jpg';

interface JsonLdEvent {
  '@type': string;
  '@id': string;
  name: string;
  url: string;
  startDate: string;
  endDate?: string;
  image?: string;
  description?: string;
  location?: Array<{
    '@type': string;
    name: string;
    address?: {
      '@type': string;
      streetAddress?: string;
    };
  }>;
  eventStatus?: string;
}

/**
 * Parse ISO date string from Long Center format
 * Format: "2025-12-5T19:30-6:00" (note: single digit day, timezone offset)
 */
function parseLongCenterDate(dateStr: string): Date | null {
  try {
    // Normalize the date string - Long Center uses format like "2025-12-5T19:30-6:00"
    // Need to convert to proper ISO: "2025-12-05T19:30:00-06:00"
    const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{2})([+-]\d{1,2}):(\d{2})$/);
    
    if (match) {
      const [, year, month, day, hour, minute, tzHour, tzMin] = match;
      const tzSign = tzHour.startsWith('-') ? '-' : '+';
      const tzHourAbs = Math.abs(parseInt(tzHour)).toString().padStart(2, '0');
      const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00${tzSign}${tzHourAbs}:${tzMin}`;
      return new Date(isoStr);
    }
    
    // Fallback: try direct parsing
    return new Date(dateStr);
  } catch (error) {
    console.error(`Failed to parse Long Center date: ${dateStr}`, error);
    return null;
  }
}

/**
 * Clean HTML from description text
 */
function cleanDescription(html: string | undefined): string | null {
  if (!html) return null;
  
  const $ = cheerio.load(`<div>${html}</div>`);
  let text = $('div').text();
  text = text.replace(/\s+/g, ' ').trim();
  
  if (text.length > 500) {
    text = text.substring(0, 497) + '...';
  }
  
  return text || null;
}

/**
 * Extract venue/hall name from location data
 */
function extractHallName(location: JsonLdEvent['location']): string {
  if (!location || location.length === 0) return 'Long Center';
  
  const hallName = location[0]?.name;
  if (!hallName) return 'Long Center';
  
  const knownHalls = ['Dell Hall', 'Rollins Studio Theatre', 'Long Center Terrace'];
  return knownHalls.includes(hallName) ? hallName : 'Long Center';
}

/**
 * Fetch and parse Long Center events
 */
export async function fetchEventsFromLongCenter(): Promise<NormalizedEvent[]> {
  console.log('🎭 Fetching Long Center events...');
  
  try {
    const response = await fetch(LONG_CENTER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const events: NormalizedEvent[] = [];
    const seenEvents = new Set<string>();
    
    // Find all JSON-LD script blocks
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonText = $(element).text();
        const jsonData = JSON.parse(jsonText) as JsonLdEvent;
        
        if (jsonData['@type'] !== 'Event') return;
        if (seenEvents.has(jsonData.url)) return;
        seenEvents.add(jsonData.url);
        if (jsonData.eventStatus?.includes('Cancelled')) return;
        
        const startDate = parseLongCenterDate(jsonData.startDate);
        if (!startDate || isNaN(startDate.getTime())) {
          console.warn(`Skipping event with invalid date: ${jsonData.name}`);
          return;
        }
        
        if (startDate < new Date()) return;
        
        const hallName = extractHallName(jsonData.location);
        const baseDescription = cleanDescription(jsonData.description);
        
        const event: NormalizedEvent = {
          venueSlug: 'long-center',
          title: jsonData.name,
          startDateTime: startDate,
          url: jsonData.url,
          imageUrl: jsonData.image || LONG_CENTER_DEFAULT_IMAGE,
          description: hallName !== 'Long Center' 
            ? `[${hallName}] ${baseDescription || ''}`.trim()
            : baseDescription,
          sourceEventId: jsonData['@id'] || `longcenter-${jsonData.url}`,
          source: EventSource.VENUE_WEBSITE,
        };
        
        events.push(event);
      } catch {
        // Skip invalid JSON blocks
      }
    });
    
    console.log(`✅ Found ${events.length} Long Center events`);
    return events;
    
  } catch (error) {
    console.error('❌ Failed to fetch Long Center events:', error);
    throw error;
  }
}

export { parseLongCenterDate, cleanDescription, extractHallName };

