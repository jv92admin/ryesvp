'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Enrichment } from '@prisma/client';
import { EventPlanPanel } from './EventPlanPanel';
import { DayOfModeView } from './squad/DayOfModeView';
import { ExploreCard } from './ExploreCard';

interface EventContentTabsProps {
  squadId: string;
  eventId: string;
  displayTitle: string;
  startDateTime: string;
  enrichment: Enrichment | null;
  venue: {
    name: string;
    city?: string | null;
    state?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
}

type Tab = 'plan' | 'dayof' | 'explore';

export function EventContentTabs({
  squadId,
  eventId,
  displayTitle,
  startDateTime,
  enrichment,
  venue,
}: EventContentTabsProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'plan';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const tabBase = 'px-4 py-2 text-sm font-medium transition-colors relative';
  const tabActive = 'text-[var(--lark-text-primary)]';
  const tabInactive = 'text-[var(--lark-text-muted)] hover:text-[var(--lark-text-secondary)]';

  // Construct squad object for DayOfModeView
  const squadForDayOf = {
    id: squadId,
    eventId,
    event: {
      id: eventId,
      displayTitle,
      startDateTime,
      venue: {
        name: venue.name,
        city: venue.city || null,
        state: venue.state || null,
        lat: venue.lat || null,
        lng: venue.lng || null,
      },
    },
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'plan', label: 'Plan' },
    { key: 'dayof', label: 'Day Of' },
    { key: 'explore', label: 'Explore' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${tabBase} ${activeTab === tab.key ? tabActive : tabInactive}`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content — crossfade on switch */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'plan' && (
          <EventPlanPanel squadId={squadId} eventId={eventId} />
        )}

        {activeTab === 'dayof' && (
          <DayOfModeView
            squad={squadForDayOf}
            currentUserId=""
            onSquadRefresh={async () => {}}
            enrichment={enrichment}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreCard enrichment={enrichment} />
        )}
      </div>
    </div>
  );
}
