import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { 
  getWeatherForDate, 
  roundCoords, 
  getDateString,
  getDaysFromNow,
  type WeatherData 
} from '@/lib/weather';

const CACHE_TTL_HOURS = 1; // Cache for 1 hour

/**
 * GET /api/weather?lat=X&lng=Y&date=YYYY-MM-DD
 * 
 * Returns weather data for a location and date.
 * Uses cache to avoid hitting Google API on every request.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const dateStr = searchParams.get('date') || '';

    // Validate params
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'lat and lng are required' },
        { status: 400 }
      );
    }

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: 'date is required in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    const eventDate = new Date(dateStr + 'T12:00:00'); // Noon to avoid timezone issues
    const daysFromNow = getDaysFromNow(eventDate);

    // Check if event is too far in the future
    if (daysFromNow > 10) {
      return NextResponse.json({
        available: false,
        reason: 'Forecast not available for dates more than 10 days out',
        daysFromNow,
      });
    }

    // Check if event is in the past
    if (daysFromNow < 0) {
      return NextResponse.json({
        available: false,
        reason: 'Event date is in the past',
        daysFromNow,
      });
    }

    // Round coordinates for cache lookup
    const coords = roundCoords(lat, lng);

    // Check cache
    const cached = await prisma.weatherCache.findUnique({
      where: {
        lat_lng_forecastDate: {
          lat: coords.lat,
          lng: coords.lng,
          forecastDate: dateStr,
        },
      },
    });

    // If cached and fresh (< 1 hour), return it
    if (cached) {
      const cacheAge = Date.now() - cached.fetchedAt.getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);
      
      if (cacheAgeHours < CACHE_TTL_HOURS) {
        return NextResponse.json({
          available: true,
          cached: true,
          cacheAgeMinutes: Math.round(cacheAge / (1000 * 60)),
          weather: {
            tempHigh: cached.tempHigh,
            tempLow: cached.tempLow,
            feelsLikeHigh: cached.feelsLikeHigh,
            feelsLikeLow: cached.feelsLikeLow,
            precipChance: cached.precipChance,
            humidity: cached.humidity,
            uvIndex: cached.uvIndex,
            windSpeed: cached.windSpeed,
            condition: cached.condition,
            conditionIcon: cached.conditionIcon,
          },
        });
      }
    }

    // Fetch fresh data from Google Weather API
    const weather = await getWeatherForDate(coords.lat, coords.lng, eventDate);

    if (!weather) {
      return NextResponse.json({
        available: false,
        reason: 'Unable to fetch weather data',
      });
    }

    // Upsert cache
    await prisma.weatherCache.upsert({
      where: {
        lat_lng_forecastDate: {
          lat: coords.lat,
          lng: coords.lng,
          forecastDate: dateStr,
        },
      },
      create: {
        lat: coords.lat,
        lng: coords.lng,
        forecastDate: dateStr,
        ...weather,
      },
      update: {
        ...weather,
        fetchedAt: new Date(),
      },
    });

    return NextResponse.json({
      available: true,
      cached: false,
      weather,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}

