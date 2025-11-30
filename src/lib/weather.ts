/**
 * Google Weather API client
 * 
 * Uses daily forecast for events 1-10 days out,
 * current conditions for today's events.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const WEATHER_BASE_URL = 'https://weather.googleapis.com/v1';

export interface WeatherData {
  tempHigh: number;       // Fahrenheit
  tempLow: number;
  feelsLikeHigh: number;
  feelsLikeLow: number;
  precipChance: number;   // Percentage
  humidity: number;       // Percentage
  uvIndex: number;
  windSpeed: number;      // MPH
  condition: string;      // "Sunny", "Cloudy", etc.
  conditionIcon: string;  // URL
}

interface GoogleCurrentConditions {
  temperature: { degrees: number };
  feelsLikeTemperature: { degrees: number };
  relativeHumidity: number;
  uvIndex: number;
  precipitation: { probability: { percent: number } };
  wind: { speed: { value: number } };
  weatherCondition: {
    description: { text: string };
    iconBaseUri: string;
  };
  currentConditionsHistory?: {
    maxTemperature: { degrees: number };
    minTemperature: { degrees: number };
  };
}

interface GoogleDailyForecast {
  forecastDays: Array<{
    displayDate: { year: number; month: number; day: number };
    maxTemperature: { degrees: number };
    minTemperature: { degrees: number };
    feelsLikeMaxTemperature: { degrees: number };
    feelsLikeMinTemperature: { degrees: number };
    daytimeForecast: {
      relativeHumidity: number;
      uvIndex: number;
      precipitation: { probability: { percent: number } };
      wind: { speed: { value: number } };
      weatherCondition: {
        description: { text: string };
        iconBaseUri: string;
      };
    };
  }>;
}

/**
 * Round lat/lng to ~1km precision for cache efficiency
 */
export function roundCoords(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat * 100) / 100,  // ~1.1km precision
    lng: Math.round(lng * 100) / 100,
  };
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate days from now to target date
 */
export function getDaysFromNow(targetDate: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Fetch current conditions from Google Weather API
 */
export async function fetchCurrentConditions(lat: number, lng: number): Promise<WeatherData | null> {
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not configured');
    return null;
  }

  try {
    const url = `${WEATHER_BASE_URL}/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&unitsSystem=IMPERIAL`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google Weather API error:', response.status, await response.text());
      return null;
    }

    const data: GoogleCurrentConditions = await response.json();
    
    return {
      tempHigh: Math.round(data.currentConditionsHistory?.maxTemperature?.degrees ?? data.temperature.degrees),
      tempLow: Math.round(data.currentConditionsHistory?.minTemperature?.degrees ?? data.temperature.degrees),
      feelsLikeHigh: Math.round(data.feelsLikeTemperature.degrees),
      feelsLikeLow: Math.round(data.feelsLikeTemperature.degrees),
      precipChance: data.precipitation.probability.percent,
      humidity: data.relativeHumidity,
      uvIndex: data.uvIndex,
      windSpeed: data.wind.speed.value,
      condition: data.weatherCondition.description.text,
      conditionIcon: data.weatherCondition.iconBaseUri + '.svg',
    };
  } catch (error) {
    console.error('Error fetching current conditions:', error);
    return null;
  }
}

/**
 * Fetch daily forecast from Google Weather API
 */
export async function fetchDailyForecast(
  lat: number, 
  lng: number, 
  targetDate: Date
): Promise<WeatherData | null> {
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not configured');
    return null;
  }

  const daysFromNow = getDaysFromNow(targetDate);
  
  // Can only forecast up to 10 days
  if (daysFromNow > 10) {
    return null;
  }

  try {
    // Request enough days to include our target date (add buffer for timezone edge cases)
    const days = Math.min(daysFromNow + 3, 10);
    // Add pageSize to avoid pagination - Google defaults to 5 days per page
    const url = `${WEATHER_BASE_URL}/forecast/days:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&days=${days}&pageSize=${days}&unitsSystem=IMPERIAL`;
    
    console.log(`[Weather] Fetching ${days} days forecast for ${lat},${lng}, target: ${targetDate.toISOString()}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Weather] Google API error ${response.status}:`, errorText);
      return null;
    }

    const data: GoogleDailyForecast = await response.json();
    console.log(`[Weather] Got ${data.forecastDays?.length || 0} days from API`);
    
    // Find the forecast for our target date
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    
    const dayForecast = data.forecastDays.find(
      (d) => d.displayDate.year === targetYear && 
             d.displayDate.month === targetMonth && 
             d.displayDate.day === targetDay
    );

    if (!dayForecast) {
      const availableDates = data.forecastDays.map(d => `${d.displayDate.year}-${d.displayDate.month}-${d.displayDate.day}`);
      console.error(`[Weather] Target date ${targetYear}-${targetMonth}-${targetDay} not found. Available: ${availableDates.join(', ')}`);
      return null;
    }

    const daytime = dayForecast.daytimeForecast;
    
    return {
      tempHigh: Math.round(dayForecast.maxTemperature.degrees),
      tempLow: Math.round(dayForecast.minTemperature.degrees),
      feelsLikeHigh: Math.round(dayForecast.feelsLikeMaxTemperature.degrees),
      feelsLikeLow: Math.round(dayForecast.feelsLikeMinTemperature.degrees),
      precipChance: daytime.precipitation.probability.percent,
      humidity: daytime.relativeHumidity,
      uvIndex: daytime.uvIndex,
      windSpeed: daytime.wind.speed.value,
      condition: daytime.weatherCondition.description.text,
      conditionIcon: daytime.weatherCondition.iconBaseUri + '.svg',
    };
  } catch (error) {
    console.error('Error fetching daily forecast:', error);
    return null;
  }
}

/**
 * Get weather for an event date
 * Uses current conditions for today, daily forecast for 1-10 days out
 */
export async function getWeatherForDate(
  lat: number, 
  lng: number, 
  eventDate: Date
): Promise<WeatherData | null> {
  const daysFromNow = getDaysFromNow(eventDate);
  
  if (daysFromNow < 0) {
    // Event is in the past
    return null;
  }
  
  if (daysFromNow === 0) {
    // Today - use current conditions
    return fetchCurrentConditions(lat, lng);
  }
  
  if (daysFromNow <= 10) {
    // 1-10 days out - use daily forecast
    return fetchDailyForecast(lat, lng, eventDate);
  }
  
  // More than 10 days out - no forecast available
  return null;
}

