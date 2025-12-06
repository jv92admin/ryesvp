'use client';

import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { SquadStops } from './SquadStops';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SquadStop {
  id: string;
  label: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  sortOrder: number;
  addedBy: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface WeatherData {
  tempHigh: number;
  tempLow: number;
  feelsLikeHigh: number;
  precipChance: number;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
  condition: string;
  conditionIcon: string;
}

interface Enrichment {
  tmInfo?: string | null;
  tmPleaseNote?: string | null;
  tmTicketLimit?: number | null;
  tmUrl?: string | null;
  tmSupportingActs?: string[] | null;
}

interface Squad {
  id: string;
  eventId: string;
  event: {
    id: string;
    displayTitle: string;
    startDateTime: string;
    venue: {
      name: string;
      city: string | null;
      state: string | null;
      lat: number | null;
      lng: number | null;
    };
  };
}

interface DayOfModeViewProps {
  squad: Squad;
  currentUserId: string;
  onSquadRefresh: () => Promise<void>;
  enrichment?: Enrichment | null;
}

export function DayOfModeView({ squad, enrichment }: DayOfModeViewProps) {
  const [stops, setStops] = useState<SquadStop[]>([]);
  const [loadingStops, setLoadingStops] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const eventDate = new Date(squad.event.startDateTime);
  const formattedEventDate = formatInTimeZone(eventDate, AUSTIN_TIMEZONE, 'EEEE, MMM d');
  const formattedEventTime = formatInTimeZone(eventDate, AUSTIN_TIMEZONE, 'h:mm a');

  // Fetch stops on mount
  useEffect(() => {
    fetchStops();
  }, [squad.id]);

  // Fetch weather on mount
  useEffect(() => {
    fetchWeather();
  }, [squad.id, squad.event.startDateTime]);

  const fetchStops = async () => {
    try {
      const response = await fetch(`/api/squads/${squad.id}/stops`);
      if (response.ok) {
        const data = await response.json();
        setStops(data.stops);
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
    } finally {
      setLoadingStops(false);
    }
  };

  const fetchWeather = async () => {
    const { lat, lng } = squad.event.venue;
    
    if (!lat || !lng) {
      setWeatherError('Venue location not available');
      setWeatherLoading(false);
      return;
    }

    try {
      // Get date in Austin timezone (avoid UTC conversion issues)
      const dateStr = formatInTimeZone(eventDate, AUSTIN_TIMEZONE, 'yyyy-MM-dd');
      const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}&date=${dateStr}`);
      const data = await response.json();
      
      if (data.available && data.weather) {
        setWeather(data.weather);
        setWeatherError(null);
      } else {
        setWeatherError(data.reason || 'Weather not available');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherError('Failed to load weather');
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Event Quick Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
          {squad.event.displayTitle}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {formattedEventDate} • {formattedEventTime}
        </p>
        <p className="text-sm text-gray-500">
          📍 {squad.event.venue.name}
          {squad.event.venue.city && `, ${squad.event.venue.city}`}
        </p>
      </div>

      {/* Itinerary / Stops */}
      {loadingStops ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-pulse text-gray-400">Loading itinerary...</div>
        </div>
      ) : (
        <SquadStops
          squadId={squad.id}
          stops={stops}
          onRefresh={fetchStops}
        />
      )}

      {/* Weather */}
      <div className="bg-gradient-to-r from-sky-50 to-sky-100 rounded-lg border border-sky-200 p-4">
        {weatherLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-200 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-sky-200 rounded w-24 animate-pulse mb-2" />
              <div className="h-3 bg-sky-200 rounded w-32 animate-pulse" />
            </div>
          </div>
        ) : weather ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={weather.conditionIcon} 
                  alt={weather.condition}
                  className="w-12 h-12"
                />
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {weather.tempHigh}°F
                  </div>
                  <div className="text-sm text-gray-600">{weather.condition}</div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>Low: {weather.tempLow}°F</div>
                <div>Feels like: {weather.feelsLikeHigh}°F</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white/50 rounded p-2">
                <div className="text-gray-500">Rain</div>
                <div className="font-medium text-gray-900">{weather.precipChance}%</div>
              </div>
              <div className="bg-white/50 rounded p-2">
                <div className="text-gray-500">Humidity</div>
                <div className="font-medium text-gray-900">{weather.humidity}%</div>
              </div>
              <div className="bg-white/50 rounded p-2">
                <div className="text-gray-500">UV</div>
                <div className="font-medium text-gray-900">{weather.uvIndex}</div>
              </div>
              <div className="bg-white/50 rounded p-2">
                <div className="text-gray-500">Wind</div>
                <div className="font-medium text-gray-900">{weather.windSpeed} mph</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌤️</span>
            <div>
              <h3 className="font-medium text-gray-900">Weather</h3>
              <p className="text-sm text-gray-600">
                {weatherError || 'Forecast not available yet'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Know Before You Go */}
      {(enrichment?.tmInfo || enrichment?.tmPleaseNote || enrichment?.tmTicketLimit || (enrichment?.tmSupportingActs && enrichment.tmSupportingActs.length > 0)) ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">📋 Know before you go</h3>
          <div className="space-y-3 text-sm">
            {enrichment?.tmSupportingActs && enrichment.tmSupportingActs.length > 0 && (
              <div>
                <div className="text-gray-500 text-xs mb-1">Supporting Acts</div>
                <p className="text-gray-700">
                  {enrichment.tmSupportingActs.join(', ')}
                </p>
              </div>
            )}
            {enrichment?.tmInfo && (
              <div>
                <div className="text-gray-500 text-xs mb-1">Event Info</div>
                <p className="text-gray-700 whitespace-pre-wrap">{enrichment.tmInfo}</p>
              </div>
            )}
            {enrichment?.tmPleaseNote && (
              <div>
                <div className="text-gray-500 text-xs mb-1">Please Note</div>
                <p className="text-gray-700 whitespace-pre-wrap">{enrichment.tmPleaseNote}</p>
              </div>
            )}
            {enrichment?.tmTicketLimit && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>🎟️</span>
                <span>Max {enrichment.tmTicketLimit} tickets per order</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">⚡ Quick actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${squad.event.venue.name} ${squad.event.venue.city || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🗺️ Maps
          </a>
          <a
            href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(
              `${squad.event.venue.name}, ${squad.event.venue.city || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🚗 Uber
          </a>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Ticket links coming soon
        </p>
      </div>
    </div>
  );
}

