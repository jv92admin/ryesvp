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
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-4">
        <h3 className="font-medium text-[var(--lark-text-primary)] text-sm line-clamp-1">
          {squad.event.displayTitle}
        </h3>
        <p className="text-sm text-[var(--lark-text-secondary)] mt-1">
          {formattedEventDate} • {formattedEventTime}
        </p>
        <p className="text-sm text-[var(--lark-text-secondary)]">
          {squad.event.venue.name}
          {squad.event.venue.city && `, ${squad.event.venue.city}`}
        </p>
      </div>

      {/* Itinerary / Stops */}
      {loadingStops ? (
        <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-8 text-center">
          <div className="animate-pulse text-[var(--lark-text-muted)]">Loading itinerary...</div>
        </div>
      ) : (
        <SquadStops
          squadId={squad.id}
          stops={stops}
          onRefresh={fetchStops}
        />
      )}

      {/* Weather */}
      <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] p-4">
        {weatherLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--bg-surface)] rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-[var(--bg-surface)] rounded w-24 animate-pulse mb-2" />
              <div className="h-3 bg-[var(--bg-surface)] rounded w-32 animate-pulse" />
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
                  <div className="text-2xl font-semibold text-[var(--lark-text-primary)]">
                    {weather.tempHigh}°F
                  </div>
                  <div className="text-sm text-[var(--lark-text-secondary)]">{weather.condition}</div>
                </div>
              </div>
              <div className="text-right text-sm text-[var(--lark-text-secondary)]">
                <div>Low: {weather.tempLow}°F</div>
                <div>Feels like: {weather.feelsLikeHigh}°F</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-[var(--bg-elevated)]/50 rounded p-2">
                <div className="text-[var(--lark-text-secondary)]">Rain</div>
                <div className="font-medium text-[var(--lark-text-primary)]">{weather.precipChance}%</div>
              </div>
              <div className="bg-[var(--bg-elevated)]/50 rounded p-2">
                <div className="text-[var(--lark-text-secondary)]">Humidity</div>
                <div className="font-medium text-[var(--lark-text-primary)]">{weather.humidity}%</div>
              </div>
              <div className="bg-[var(--bg-elevated)]/50 rounded p-2">
                <div className="text-[var(--lark-text-secondary)]">UV</div>
                <div className="font-medium text-[var(--lark-text-primary)]">{weather.uvIndex}</div>
              </div>
              <div className="bg-[var(--bg-elevated)]/50 rounded p-2">
                <div className="text-[var(--lark-text-secondary)]">Wind</div>
                <div className="font-medium text-[var(--lark-text-primary)]">{weather.windSpeed} mph</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-[var(--lark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            <div>
              <h3 className="font-medium text-[var(--lark-text-primary)]">Weather</h3>
              <p className="text-sm text-[var(--lark-text-secondary)]">
                {weatherError || 'Forecast not available yet'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Know Before You Go */}
      {(enrichment?.tmInfo || enrichment?.tmPleaseNote || enrichment?.tmTicketLimit || (enrichment?.tmSupportingActs && enrichment.tmSupportingActs.length > 0)) ? (
        <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-4">
          <h3 className="font-medium text-[var(--lark-text-primary)] mb-3">Know before you go</h3>
          <div className="space-y-3 text-sm">
            {enrichment?.tmSupportingActs && enrichment.tmSupportingActs.length > 0 && (
              <div>
                <div className="text-[var(--lark-text-secondary)] text-xs mb-1">Supporting Acts</div>
                <p className="text-[var(--lark-text-primary)]">
                  {enrichment.tmSupportingActs.join(', ')}
                </p>
              </div>
            )}
            {enrichment?.tmInfo && (
              <div>
                <div className="text-[var(--lark-text-secondary)] text-xs mb-1">Event Info</div>
                <p className="text-[var(--lark-text-primary)] whitespace-pre-wrap">{enrichment.tmInfo}</p>
              </div>
            )}
            {enrichment?.tmPleaseNote && (
              <div>
                <div className="text-[var(--lark-text-secondary)] text-xs mb-1">Please Note</div>
                <p className="text-[var(--lark-text-primary)] whitespace-pre-wrap">{enrichment.tmPleaseNote}</p>
              </div>
            )}
            {enrichment?.tmTicketLimit && (
              <div className="flex items-center gap-2 text-[var(--lark-text-secondary)]">
                <span className="text-xs font-semibold text-[var(--lark-text-muted)]">TIX</span>
                <span>Max {enrichment.tmTicketLimit} tickets per order</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-4">
        <h3 className="font-medium text-[var(--lark-text-primary)] mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${squad.event.venue.name} ${squad.event.venue.city || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--lark-text-primary)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            Maps
          </a>
          <a
            href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(
              `${squad.event.venue.name}, ${squad.event.venue.city || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--lark-text-primary)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            Uber
          </a>
        </div>
        <p className="text-xs text-[var(--lark-text-muted)] text-center mt-2">
          Ticket links coming soon
        </p>
      </div>
    </div>
  );
}

