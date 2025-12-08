import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { load } from 'cheerio';
import { inferCategory } from '../utils/dateParser';
import { createAustinDate } from '@/lib/utils';

/**
 * Scrape events from Stubb's BBQ website.
 * 
 * Stubb's is a live music venue and BBQ restaurant in Austin.
 * The website uses a custom event listing system with static HTML.
 * 
 * Event structure:
 * - Container: .tw-section
 * - Date: .tw-event-date (format: "11/30")
 * - Title: .tw-name a
 * - Time: .tw-event-time (show time)
 * - Door time: .tw-event-door-time
 * - Image: .event-img
 * - Price: .tw-price
 * - URL contains full date: /tm-event/event-name-2025-11-30/
 */
export async function fetchEventsFromStubbs(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];
  
  try {
    // Fetch the concert listings page
    const response = await fetch('https://stubbsaustin.com/concert-listings/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`Stubb's: HTTP ${response.status}`);
      return events;
    }

    const html = await response.text();
    const $ = load(html);

    // Find all event sections
    const eventSections = $('.tw-section').toArray();
    console.log(`Stubb's: Found ${eventSections.length} event sections`);

    for (const section of eventSections) {
      try {
        const $section = $(section);

        // Get title and URL from the name link
        const nameLink = $section.find('.tw-name a').first();
        const title = nameLink.text().trim();
        const eventUrl = nameLink.attr('href') || '';

        if (!title) {
          continue;
        }

        // Get date from display (format: "11/30")
        const displayDate = $section.find('.tw-event-date').first().text().trim();
        const dayOfWeek = $section.find('.tw-day-of-week').first().text().trim();

        // Get show time
        const timeText = $section.find('.tw-event-time').first().text().trim();
        const timeInfo = parseTimeFromText(timeText);

        // Parse date - try to extract year from URL first
        const startDateTime = parseStubbyDate(displayDate, eventUrl, timeInfo.hour, timeInfo.minute);

        if (!startDateTime || isNaN(startDateTime.getTime())) {
          console.log(`Stubb's: Could not parse date for "${title}": ${displayDate}`);
          continue;
        }

        // Get door time for description
        const doorTime = $section.find('.tw-event-door-time').first().text().trim();

        // Get image URL
        let imageUrl = $section.find('.event-img').first().attr('src') || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://stubbsaustin.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }

        // Get price info
        const price = $section.find('.tw-price').first().text().trim();

        // Get age restriction
        const ageRestriction = $section.find('.tw-age-restriction').first().text().trim();

        // Build description
        const descriptionParts: string[] = [];
        if (doorTime) descriptionParts.push(`Doors: ${doorTime}`);
        if (price) descriptionParts.push(`Price: ${price}`);
        if (ageRestriction && ageRestriction !== 'and up') {
          descriptionParts.push(`Ages: ${ageRestriction}`);
        }
        
        const description = descriptionParts.length > 0 ? descriptionParts.join(' | ') : null;

        // Extract source event ID from URL
        // URL format: https://stubbsaustin.com/tm-event/gospel-brunch-2025-11-30/
        const sourceEventId = extractEventIdFromUrl(eventUrl);

        // Infer category
        const category = inferStubbsCategory(title, timeText);

        events.push({
          venueSlug: 'stubbs',
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
        console.error("Stubb's: Error parsing event section:", error);
      }
    }

    console.log(`Stubb's: Extracted ${events.length} events`);

  } catch (error) {
    console.error("Error scraping Stubb's:", error);
  }

  return events;
}

/**
 * Parse Stubb's date format
 * Display date: "11/30" (month/day only)
 * URL contains full date: /tm-event/gospel-brunch-2025-11-30/
 */
function parseStubbyDate(displayDate: string, url: string, hour: number | null, minute: number): Date | null {
  try {
    // Default to 8 PM if no time provided
    const finalHour = hour ?? 20;
    const finalMinute = minute;

    // First try to extract full date from URL
    // URL pattern: /tm-event/event-name-YYYY-MM-DD/ or /tm-event/event-name-2025-11-30/
    const urlDateMatch = url.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (urlDateMatch) {
      const [, year, month, day] = urlDateMatch;
      // Create date in Austin timezone
      return createAustinDate(parseInt(year), parseInt(month) - 1, parseInt(day), finalHour, finalMinute);
    }

    // Fall back to parsing display date with current/next year logic
    const parts = displayDate.split('/');
    if (parts.length !== 2) {
      return null;
    }

    const month = parseInt(parts[0], 10) - 1; // 0-indexed
    const day = parseInt(parts[1], 10);

    // Determine year - if the date has passed this year, use next year
    const now = new Date();
    let year = now.getFullYear();
    
    const testDate = new Date(year, month, day);
    if (testDate < now) {
      year += 1;
    }

    // Create date in Austin timezone
    return createAustinDate(year, month, day, finalHour, finalMinute);

  } catch (error) {
    console.error("Stubb's: Error parsing date:", error);
    return null;
  }
}

/**
 * Parse time from the time text field
 * Examples:
 * - "Show: 10:30AM, 12:30PM" (multiple seatings)
 * - "Show: 8:00PM"
 * - "Doors: 7:00PM"
 */
function parseTimeFromText(timeText: string): { hour: number | null; minute: number } {
  if (!timeText) {
    return { hour: null, minute: 0 };
  }

  // Extract the first time mentioned
  const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) {
    return { hour: null, minute: 0 };
  }

  let hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  const isPM = timeMatch[3].toUpperCase() === 'PM';

  if (isPM && hour !== 12) {
    hour += 12;
  } else if (!isPM && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

/**
 * Extract event ID from URL
 * Example: "https://stubbsaustin.com/tm-event/gospel-brunch-2025-11-30/"
 * Returns: "gospel-brunch-2025-11-30"
 */
function extractEventIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/tm-event\/([^/]+)/);
  return match ? match[1].replace(/\/$/, '') : undefined;
}

/**
 * Infer category for Stubb's events
 * Most are concerts, but Gospel Brunch is a special case
 */
function inferStubbsCategory(title: string, timeText: string): EventCategory {
  const lowerTitle = title.toLowerCase();
  const lowerTime = timeText.toLowerCase();

  // Gospel Brunch is a special recurring event
  if (lowerTitle.includes('gospel brunch') || lowerTitle.includes('brunch')) {
    return EventCategory.OTHER; // Food/music experience
  }

  // Comedy shows
  if (
    lowerTitle.includes('comedy') ||
    lowerTitle.includes('stand-up') ||
    lowerTitle.includes('comedian')
  ) {
    return EventCategory.COMEDY;
  }

  // Most Stubb's events are concerts
  return EventCategory.CONCERT;
}

