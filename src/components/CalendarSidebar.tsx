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

interface CalendarSidebarProps {
  isLoggedIn: boolean;
}

export function CalendarSidebar({ isLoggedIn }: CalendarSidebarProps) {
  const [loading, setLoading] = useState(true);
  const [newListings, setNewListings] = useState<NewListingEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch recently added events (last 48 hours)
        const newListingsRes = await fetch('/api/events/recent');
        if (newListingsRes.ok) {
          const recentData = await newListingsRes.json();
          setNewListings(recentData.events || []);
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Listings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>✨</span>
          New Listings
        </h3>
        
        {newListings.length === 0 ? (
          <p className="text-sm text-gray-500">No new listings in the last 48 hours</p>
        ) : (
          <div className="space-y-2">
            {newListings.slice(0, 3).map((event) => {
              const isNew = isNewListing(new Date(event.createdAt));
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isNew && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700">
                        NEW
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatInTimeZone(new Date(event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
                    {' • '}
                    {event.venue.name}
                  </p>
                </Link>
              );
            })}
            {newListings.length > 3 && (
              <p className="text-xs text-gray-500 pt-1">
                +{newListings.length - 3} more new listings
              </p>
            )}
          </div>
        )}
      </div>

      {/* Presales */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>⚡</span>
          Presales
        </h3>
        
        {/* TODO: Implement when we have reliable presale data from TM enrichment */}
        <p className="text-sm text-gray-500">Coming soon - presale alerts</p>
      </div>

      {/* Recommendations/Discover */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-dashed border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>🎯</span>
          Recommendations
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <span className="text-lg">🤖</span>
            <div>
              <div className="font-medium text-gray-900">Smart Suggestions</div>
              <div className="text-xs text-gray-600 mt-1">Events based on your taste & friend activity</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <span className="text-lg">🔥</span>
            <div>
              <div className="font-medium text-gray-900">Trending Now</div>
              <div className="text-xs text-gray-600 mt-1">Popular in Austin & your communities</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
            <span className="text-lg">👥</span>
            <div>
              <div className="font-medium text-gray-900">Friend Discoveries</div>
              <div className="text-xs text-gray-600 mt-1">Events your friends are talking about</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="pt-3 mt-3 border-t border-green-200/50">
          <div className="text-xs text-gray-500 text-center">
            <strong className="text-[var(--brand-primary)]">Smart Discovery</strong> • Coming Q1 2025
          </div>
        </div>
      </div>

      {/* Not logged in CTA */}
      {!isLoggedIn && (
        <div className="bg-[var(--brand-primary-light)] border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">👋 Join RyesVP</h3>
          <p className="text-sm text-green-800 mb-3">
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
