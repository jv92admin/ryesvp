import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';
import { launchBrowser } from '@/lib/browser';
import { load } from 'cheerio';
import { inferYear } from '../utils/dateParser';
import { createAustinDate } from '@/lib/utils';

/**
 * Scraper for The Concourse Project
 * URL: https://concourseproject.com/calendar/
 * 
 * Uses SeeTickets widget with JavaScript rendering.
 * Has a "Load More" button to show additional events.
 */
export async function fetchEventsFromConcourseProject(): Promise<NormalizedEvent[]> {
    const events: NormalizedEvent[] = [];
    let browser;

    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        console.log('Concourse Project: Starting scraper...');
        await page.goto('https://concourseproject.com/calendar/', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        console.log('Concourse Project: Waiting for events to load...');

        // Wait for event containers to appear
        await page.waitForSelector('.seetickets-list-event-container', { timeout: 30000 });
        console.log('Concourse Project: Found event containers');

        // Click "Load More" button repeatedly until all events are loaded
        let previousEventCount = 0;
        let loadMoreAttempts = 0;
        const maxLoadMoreAttempts = 20;

        while (loadMoreAttempts < maxLoadMoreAttempts) {
            const currentEventCount = await page.$$eval(
                '.seetickets-list-event-container', 
                items => items.length
            );
            console.log(`Concourse Project: Attempt ${loadMoreAttempts + 1}, found ${currentEventCount} events`);

            if (currentEventCount === previousEventCount && loadMoreAttempts > 0) {
                console.log('Concourse Project: No new events loaded, stopping');
                break;
            }

            previousEventCount = currentEventCount;

            // Scroll to bottom first to make button visible
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to click "Load More" button using evaluate for proper event triggering
            const clicked = await page.evaluate(() => {
                const btn = document.querySelector('.seetickets-list-view-load-more-button') as HTMLButtonElement;
                if (btn && btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (clicked) {
                console.log('Concourse Project: Clicked Load More button, waiting for AJAX...');
                await new Promise(resolve => setTimeout(resolve, 4000)); // Wait longer for AJAX
                loadMoreAttempts++;
                continue;
            }

            console.log('Concourse Project: No Load More button found, all events loaded');
            break;
            
            loadMoreAttempts++;
        }

        const html = await page.content();
        const $ = load(html);

        // Track seen URLs to dedupe (page has duplicate containers)
        const seenUrls = new Set<string>();

        // Extract events from all containers, dedupe by URL
        $('.seetickets-list-event-container').each((i, el) => {
            try {
                const titleEl = $(el).find('p.event-title a');
                const title = titleEl.text().trim();
                const url = titleEl.attr('href') || '';
                
                const imageUrl = $(el).find('.seetickets-list-view-event-image').attr('src');
                
                const dateText = $(el).find('p.event-date').text().trim(); // "Sat Dec 6"
                const timeText = $(el).find('.see-showtime').text().trim(); // "9:00PM"
                
                const headliners = $(el).find('p.headliners').text().trim();
                const supportingTalent = $(el).find('p.supporting-talent').text().trim();
                
                const ageRestriction = $(el).find('.ages').text().trim(); // "18+"
                const priceRange = $(el).find('.price').text().trim(); // "$35.00-$55.00"
                const genre = $(el).find('p.genre').text().trim(); // "DJ/Dance"

                // Extract month and day from date text like "Sat Dec 6" or "Fri Dec 12"
                const dateMatch = dateText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/i);

                // Parse time: "9:00PM" -> hours, minutes
                let hours = 20; // Default 8pm
                let minutes = 0;
                const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (timeMatch) {
                    hours = parseInt(timeMatch[1], 10);
                    minutes = parseInt(timeMatch[2], 10);
                    const isPM = timeMatch[3].toUpperCase() === 'PM';
                    if (isPM && hours !== 12) hours += 12;
                    if (!isPM && hours === 12) hours = 0;
                }

                // Build date using Austin timezone
                let startDateTime: Date | null = null;
                if (dateMatch) {
                    const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
                        .indexOf(dateMatch[1].toLowerCase());
                    const dayNum = parseInt(dateMatch[2], 10);
                    if (monthIndex >= 0) {
                        const year = inferYear(monthIndex, dayNum);
                        startDateTime = createAustinDate(year, monthIndex, dayNum, hours, minutes);
                    }
                }

                // Build description from supporting talent
                let description = '';
                if (supportingTalent) {
                    description = `With ${supportingTalent}`;
                }
                if (ageRestriction) {
                    description += description ? ` | ${ageRestriction}` : ageRestriction;
                }
                if (priceRange) {
                    description += description ? ` | ${priceRange}` : priceRange;
                }

                if (title && startDateTime && url && !seenUrls.has(url)) {
                    seenUrls.add(url);
                    events.push({
                        title,
                        url,
                        imageUrl,
                        startDateTime,
                        endDateTime: null,
                        venueSlug: 'concourse-project',
                        source: EventSource.VENUE_WEBSITE,
                        sourceEventId: url,
                        category: genre === 'DJ/Dance' ? EventCategory.CONCERT : EventCategory.OTHER,
                        description: description || undefined,
                    });
                }
            } catch (e) {
                console.error('Error parsing Concourse Project event:', e);
            }
        });

        console.log(`Concourse Project: Extracted ${events.length} events`);
        return events;
    } catch (error) {
        console.error('Error scraping Concourse Project:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

