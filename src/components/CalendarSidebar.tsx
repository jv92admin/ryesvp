'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { isNewListing } from '@/lib/utils';

const AUSTIN_TIMEZONE = 'America/Chicago';


interface NewListingEvent {
  id: string;
  title: string;
  startDateTime: string;
  venue: { name: string };
  createdAt: string;
}

interface PresaleEvent {
  id: string;
  title: string;
  startDateTime: string;
  venue: { name: string };
  presaleType: 'active' | 'upcoming' | 'onsale';
  presaleName?: string;
  presaleDate?: string; // ISO string for the presale/onsale start
}

interface CalendarSidebarProps {
  isLoggedIn: boolean;
}

export function CalendarSidebar({ isLoggedIn }: CalendarSidebarProps) {
  const [loading, setLoading] = useState(true);
  const [newListings, setNewListings] = useState<NewListingEvent[]>([]);
  const [presaleEvents, setPresaleEvents] = useState<PresaleEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch recently added events (last 48 hours) and presale events
        const [newListingsRes, presalesRes] = await Promise.all([
          fetch('/api/events/recent'),
          fetch('/api/events/presales'),
        ]);
        
        if (newListingsRes.ok) {
          const recentData = await newListingsRes.json();
          setNewListings(recentData.events || []);
        }
        
        if (presalesRes.ok) {
          const presalesData = await presalesRes.json();
          setPresaleEvents(presalesData.events || []);
        }
      } catch (error) {
        console.error('Error fetching calendar sidebar data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-[var(--bg-surface)] rounded w-24 mb-3"></div>
          <div className="h-3 bg-[var(--bg-surface)] rounded w-full mb-2"></div>
          <div className="h-3 bg-[var(--bg-surface)] rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Listings */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-[var(--lark-text-primary)] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          New Listings
        </h3>
        
        {newListings.length === 0 ? (
          <p className="text-sm text-[var(--lark-text-secondary)]">No new listings in the last 48 hours</p>
        ) : (
          <div className="space-y-2">
            {newListings.slice(0, 3).map((event) => {
              const isNew = isNewListing(new Date(event.createdAt));
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block p-2 -mx-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {isNew && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--accent)] text-[var(--text-inverse)]">
                        NEW
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-medium text-[var(--lark-text-primary)] line-clamp-1">
                    {event.title}
                  </p>
                  <p className="text-xs text-[var(--lark-text-secondary)]">
                    {formatInTimeZone(new Date(event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
                    {' • '}
                    {event.venue.name}
                  </p>
                </Link>
              );
            })}
            {newListings.length > 3 && (
              <p className="text-xs text-[var(--lark-text-secondary)] pt-1">
                +{newListings.length - 3} more new listings
              </p>
            )}
          </div>
        )}
      </div>

      {/* Presales */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-[var(--lark-text-primary)] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Presales & On-Sales
        </h3>
        
        {presaleEvents.length === 0 ? (
          <p className="text-sm text-[var(--lark-text-secondary)]">No upcoming presales or on-sale dates</p>
        ) : (
          <div className="space-y-2">
            {presaleEvents.slice(0, 4).map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block p-2 -mx-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  {event.presaleType === 'active' && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--accent)] text-[var(--text-inverse)]">
                      {event.presaleName || 'PRESALE'} NOW
                    </span>
                  )}
                  {event.presaleType === 'upcoming' && event.presaleDate && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]">
                      {event.presaleName || 'PRESALE'} {formatInTimeZone(new Date(event.presaleDate), AUSTIN_TIMEZONE, 'MMM d')}
                    </span>
                  )}
                  {event.presaleType === 'onsale' && event.presaleDate && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]">
                      ON SALE {formatInTimeZone(new Date(event.presaleDate), AUSTIN_TIMEZONE, 'MMM d')}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--lark-text-primary)] line-clamp-1">
                  {event.title}
                </p>
                <p className="text-xs text-[var(--lark-text-secondary)]">
                  {formatInTimeZone(new Date(event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d')}
                  {' • '}
                  {event.venue.name}
                </p>
              </Link>
            ))}
            {presaleEvents.length > 4 && (
              <Link 
                href="/?discovery=presales"
                className="block text-xs text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] font-medium pt-1"
              >
                Show all {presaleEvents.length} presales →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recommendations — coming soon */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-[var(--lark-text-muted)] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Recommendations
        </h3>
        <p className="text-sm text-[var(--lark-text-muted)]">
          Smart suggestions, trending events, and friend discoveries.
        </p>
        <p className="text-xs text-[var(--lark-text-muted)] mt-2 opacity-60">Coming soon</p>
      </div>

      {/* Not logged in CTA */}
      {!isLoggedIn && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4">
          <h3 className="font-semibold text-[var(--lark-text-primary)] mb-2">Join Lark</h3>
          <p className="text-sm text-[var(--lark-text-secondary)] mb-3">
            Sign in to track your events and see social features
          </p>
          <Link
            href="/login"
            className="btn-primary block w-full text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
