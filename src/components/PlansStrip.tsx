'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEventDate } from '@/lib/utils';
import type { EventDisplay } from '@/db/events';

interface SocialResponse {
  yourPlans: EventDisplay[];
}

export function PlansStrip() {
  const [plans, setPlans] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/social')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: SocialResponse) => {
        if (!cancelled) setPlans(data.yourPlans || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Nothing to show
  if (!loading && plans.length === 0) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[200px] h-[88px] bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
        Your Plans ({plans.length})
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {plans.map((event) => {
          const friendCount = (event.social?.friendsGoing || 0) + (event.social?.friendsInterested || 0);
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="min-w-[200px] max-w-[240px] flex-shrink-0 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg p-3 hover:border-[var(--border-strong)] transition-colors"
            >
              <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                {event.displayTitle}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {formatEventDate(new Date(event.startDateTime))}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                {friendCount > 0 && `${friendCount} friend${friendCount !== 1 ? 's' : ''} · `}
                {event.venue.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
