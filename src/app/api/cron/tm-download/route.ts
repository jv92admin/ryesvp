/**
 * GET /api/cron/tm-download
 * 
 * Cron job to download Ticketmaster event cache.
 * Fetches all TM events for our mapped venues and stores in TMEventCache.
 * 
 * Schedule: Daily at 3 AM Central (9 AM UTC)
 * 
 * Auth: Requires CRON_SECRET bearer token (Vercel sends this automatically)
 * 
 * Note: Vercel Cron jobs use GET requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronStart, logCronSuccess, logCronError } from '@/lib/cron/auth';
import prisma from '@/db/prisma';
import { 
  searchEvents, 
  getBestImageUrl, 
  getPrimaryClassification,
  getSupportingActs,
  getExternalLinks,
  isConfigured 
} from '@/lib/ticketmaster';
import { VENUE_TM_MAPPING } from '@/lib/ticketmaster/venues';
import { TMEvent } from '@/lib/ticketmaster/types';

const JOB_NAME = 'tm-download';
const DEFAULT_MONTHS_AHEAD = 6;

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth check
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startTime = logCronStart(JOB_NAME);

  // Check TM API is configured
  if (!isConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'TICKETMASTER_API_KEY not configured',
      },
      { status: 500 }
    );
  }

  try {
    // Optional: allow months override via query param
    const url = new URL(request.url);
    const months = parseInt(url.searchParams.get('months') || String(DEFAULT_MONTHS_AHEAD), 10);

    // Calculate date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const startStr = startDate.toISOString().slice(0, 19) + 'Z';
    const endStr = endDate.toISOString().slice(0, 19) + 'Z';

    // Get venues with TM mappings
    const venues = Object.entries(VENUE_TM_MAPPING).filter(([, v]) => v.tmVenueId);
    
    const allTMEvents: { venueSlug: string; event: TMEvent }[] = [];
    const venueResults: { venue: string; events: number; error?: string }[] = [];

    // Fetch events for each venue
    for (const [venueSlug, mapping] of venues) {
      try {
        const events = await searchEvents({
          venueId: mapping.tmVenueId,
          startDateTime: startStr,
          endDateTime: endStr,
          size: 200,
          sort: 'date,asc',
          includeTBA: 'yes',
          includeTBD: 'yes',
        });

        for (const event of events) {
          allTMEvents.push({ venueSlug, event });
        }

        venueResults.push({ venue: venueSlug, events: events.length });

        // Rate limiting between venues
        await new Promise(r => setTimeout(r, 300));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        venueResults.push({ venue: venueSlug, events: 0, error: errorMsg });
      }
    }

    // Clear old cache and insert new
    await prisma.tMEventCache.deleteMany({});

    let inserted = 0;
    for (const { venueSlug, event } of allTMEvents) {
      try {
        const classification = getPrimaryClassification(event);
        const supportingActs = getSupportingActs(event);
        const externalLinks = getExternalLinks(event);
        const mainAttraction = event._embedded?.attractions?.[0];

        // Parse dates
        let startDateTime: Date | null = null;
        let localDate: string | null = null;
        let endDateTime: Date | null = null;
        let onSaleStart: Date | null = null;
        let onSaleEnd: Date | null = null;

        localDate = event.dates?.start?.localDate || null;

        if (event.dates?.start?.dateTime) {
          startDateTime = new Date(event.dates.start.dateTime);
        } else if (localDate) {
          startDateTime = new Date(localDate);
        }

        if (event.dates?.end?.dateTime) {
          endDateTime = new Date(event.dates.end.dateTime);
        }

        if (event.sales?.public?.startDateTime) {
          onSaleStart = new Date(event.sales.public.startDateTime);
        }
        if (event.sales?.public?.endDateTime) {
          onSaleEnd = new Date(event.sales.public.endDateTime);
        }

        if (!startDateTime || !localDate) {
          continue;
        }

        await prisma.tMEventCache.create({
          data: {
            id: event.id,
            venueSlug,
            tmVenueId: VENUE_TM_MAPPING[venueSlug].tmVenueId,
            name: event.name,
            url: event.url || null,
            localDate,
            startDateTime,
            endDateTime,
            timezone: event.dates?.timezone || null,
            spanMultipleDays: event.dates?.spanMultipleDays || false,
            onSaleStart,
            onSaleEnd,
            presales: event.sales?.presales ? JSON.parse(JSON.stringify(event.sales.presales)) : undefined,
            imageUrl: getBestImageUrl(event),
            seatmapUrl: event.seatmap?.staticUrl || null,
            attractionId: mainAttraction?.id || null,
            attractionName: mainAttraction?.name || null,
            supportingActs,
            externalLinks: Object.keys(externalLinks).length > 0 ? externalLinks : undefined,
            genre: classification.genre,
            subGenre: classification.subGenre,
            segment: classification.segment,
            promoterId: event.promoter?.id || null,
            promoterName: event.promoter?.name || null,
            status: event.dates?.status?.code || null,
            info: event.info || null,
            pleaseNote: event.pleaseNote || null,
            ticketLimit: event.accessibility?.ticketLimit || null,
          },
        });
        inserted++;
      } catch (error) {
        // Skip duplicates or errors silently
        if (error instanceof Error && !error.message.includes('Unique constraint')) {
          console.warn(`[CRON] tm-download: Error inserting ${event.name}:`, error.message);
        }
      }
    }

    const summary = {
      venuesProcessed: venues.length,
      eventsFound: allTMEvents.length,
      eventsInserted: inserted,
      venues: venueResults,
    };

    logCronSuccess(JOB_NAME, startTime, summary);

    return NextResponse.json({
      success: true,
      duration: `${Date.now() - startTime}ms`,
      ...summary,
    });
  } catch (error) {
    logCronError(JOB_NAME, startTime, error);

    return NextResponse.json(
      {
        success: false,
        duration: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/tm-download
 * 
 * Manual trigger endpoint (for local testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

