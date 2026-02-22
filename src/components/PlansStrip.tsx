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
      <div>
        <div className="h-4 w-24 bg-[var(--bg-surface)] rounded mb-2 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[200px] h-[88px] bg-[var(--bg-elevated)] rounded-[var(--card-radius)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--lark-text-secondary)] uppercase tracking-wider mb-2">
        Your Plans ({plans.length})
      </h3>
      {/* Negative right margin creates partial card peek at edge */}
      <div className="relative -mr-[var(--screen-padding)]">
        <div className="flex gap-3 overflow-x-auto pb-2 pr-[var(--screen-padding)] scrollbar-thin">
          {plans.map((event) => {
            const friendCount = (event.social?.friendsGoing || 0) + (event.social?.friendsInterested || 0);
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="min-w-[200px] max-w-[240px] flex-shrink-0 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--card-radius)] p-3 hover:border-[var(--border-visible)] transition-colors"
              >
                <p className="text-sm font-semibold text-[var(--lark-text-primary)] line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {event.displayTitle}
                </p>
                <p className="text-xs text-[var(--lark-text-secondary)] mt-1">
                  {formatEventDate(new Date(event.startDateTime))}
                </p>
                <p className="text-xs text-[var(--lark-text-muted)] mt-0.5 truncate">
                  {friendCount > 0 && `${friendCount} friend${friendCount !== 1 ? 's' : ''} · `}
                  {event.venue.name}
                </p>
              </Link>
            );
          })}
        </div>
        {/* Fade hint at right edge to signal scrollability */}
        {plans.length > 1 && (
          <div className="absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-[var(--bg-primary)] to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
