/**
 * GET /api/cron/weather-precache
 * 
 * Cron job to pre-cache weather forecasts for upcoming events.
 * Ensures Day-of mode loads instantly without hitting Google Weather API.
 * 
 * Schedule: Daily at 6 AM Central (12 PM UTC)
 * 
 * Auth: Requires CRON_SECRET bearer token (Vercel sends this automatically)
 * 
 * Note: Vercel Cron jobs use GET requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronStart, logCronSuccess, logCronError } from '@/lib/cron/auth';
import prisma from '@/db/prisma';
import { getWeatherForDate, roundCoords, getDateString } from '@/lib/weather';

const JOB_NAME = 'weather-precache';
const CACHE_TTL_HOURS = 1;

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth check
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startTime = logCronStart(JOB_NAME);

  try {
    // Get events in next 10 days with venue lat/lng
    const now = new Date();
    const tenDaysOut = new Date();
    tenDaysOut.setDate(tenDaysOut.getDate() + 10);

    const events = await prisma.event.findMany({
      where: {
        startDateTime: {
          gte: now,
          lte: tenDaysOut,
        },
        venue: {
          lat: { not: null },
          lng: { not: null },
        },
      },
      include: {
        venue: {
          select: { lat: true, lng: true, name: true },
        },
      },
      orderBy: { startDateTime: 'asc' },
    });

    // Deduplicate by (rounded lat/lng, date)
    const uniqueLocationsAndDates = new Map<string, { lat: number; lng: number; date: string; venueName: string }>();
    
    for (const event of events) {
      if (!event.venue.lat || !event.venue.lng) continue;
      
      const coords = roundCoords(event.venue.lat, event.venue.lng);
      const dateStr = getDateString(event.startDateTime);
      const key = `${coords.lat},${coords.lng},${dateStr}`;
      
      if (!uniqueLocationsAndDates.has(key)) {
        uniqueLocationsAndDates.set(key, {
          lat: coords.lat,
          lng: coords.lng,
          date: dateStr,
          venueName: event.venue.name,
        });
      }
    }

    let cached = 0;
    let skipped = 0;
    let apiCalls = 0;
    let errors = 0;

    for (const [, location] of uniqueLocationsAndDates) {
      try {
        // Check if we already have a fresh cache entry
        const existing = await prisma.weatherCache.findUnique({
          where: {
            lat_lng_forecastDate: {
              lat: location.lat,
              lng: location.lng,
              forecastDate: location.date,
            },
          },
        });

        if (existing) {
          const cacheAge = Date.now() - existing.fetchedAt.getTime();
          const cacheAgeHours = cacheAge / (1000 * 60 * 60);
          
          if (cacheAgeHours < CACHE_TTL_HOURS) {
            skipped++;
            continue;
          }
        }

        // Fetch fresh weather
        const eventDate = new Date(location.date + 'T12:00:00');
        const weather = await getWeatherForDate(location.lat, location.lng, eventDate);

        if (weather) {
          await prisma.weatherCache.upsert({
            where: {
              lat_lng_forecastDate: {
                lat: location.lat,
                lng: location.lng,
                forecastDate: location.date,
              },
            },
            create: {
              lat: location.lat,
              lng: location.lng,
              forecastDate: location.date,
              ...weather,
            },
            update: {
              ...weather,
              fetchedAt: new Date(),
            },
          });
          cached++;
        }
        
        apiCalls++;
        
        // Small delay between API calls
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        errors++;
        console.warn(`[CRON] weather-precache: Error for ${location.venueName} on ${location.date}:`, 
          error instanceof Error ? error.message : error);
      }
    }

    const summary = {
      eventsChecked: events.length,
      uniqueLocationDates: uniqueLocationsAndDates.size,
      cached,
      skipped,
      apiCalls,
      errors,
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
 * POST /api/cron/weather-precache
 * 
 * Manual trigger endpoint (for local testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

