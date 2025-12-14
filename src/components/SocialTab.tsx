'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SocialSectionA } from './social/SocialSectionA';
import { SocialSectionB } from './social/SocialSectionB';
import { SocialSummaryChips } from './social/SocialSummaryChips';
import { AddFriendCard } from './InviteLinkCard';
import { EventDisplay } from '@/db/events';

interface SocialData {
  yourPlans: EventDisplay[];
  almostPlans: EventDisplay[];
  ticketActivity: Array<{
    eventId: string;
    eventTitle: string;
    eventDate: string;
    venueName: string;
    friendId: string;
    friendName: string;
    status: 'NEED_TICKETS' | 'HAVE_TICKETS';
  }>;
}

interface NotificationData {
  id: string;
  type: string;
  payload: { squadId?: string };
  readAt: string | null;
}

export function SocialTab() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('plans');
  const [recentSquadIds, setRecentSquadIds] = useState<string[]>([]);
  
  // Refs for section anchoring
  const plansRef = useRef<HTMLDivElement>(null);
  const almostRef = useRef<HTMLDivElement>(null);
  
  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const ref = sectionId === 'plans' ? plansRef : almostRef;
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  // Build filter query string from URL params (shared with Calendar view)
  const filterQuery = (() => {
    const params = new URLSearchParams();
    const venueIds = searchParams.get('venueIds');
    const categories = searchParams.get('categories');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (venueIds) params.set('venueIds', venueIds);
    if (categories) params.set('categories', categories);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params.toString();
  })();
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch social data and notifications in parallel
        const socialUrl = filterQuery ? `/api/social?${filterQuery}` : '/api/social';
        const [socialResponse, notifResponse] = await Promise.all([
          fetch(socialUrl),
          fetch('/api/notifications'),
        ]);
        
        if (!socialResponse.ok) {
          if (socialResponse.status === 401) {
            // Not logged in - this is ok, just show empty states
            setData({ yourPlans: [], almostPlans: [], ticketActivity: [] });
            return;
          }
          throw new Error(`Failed to fetch social data: ${socialResponse.statusText}`);
        }
        
        const socialData = await socialResponse.json();
        setData(socialData);
        
        // Extract squad IDs from unread ADDED_TO_PLAN notifications
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          const unreadPlanNotifs = (notifData.notifications || []).filter(
            (n: NotificationData) => n.type === 'ADDED_TO_PLAN' && !n.readAt
          );
          const squadIds = unreadPlanNotifs
            .map((n: NotificationData) => n.payload?.squadId)
            .filter(Boolean) as string[];
          setRecentSquadIds(squadIds);
        }
      } catch (err) {
        console.error('Error fetching social data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load social data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filterQuery]);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">Error loading social data</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;
  
  // Build section counts for summary chips
  // Labels: You (your plans), Friends (friend activity), Communities (future)
  const sectionCounts = [
    { id: 'plans', label: 'You', count: data.yourPlans.length },
    { id: 'almost', label: 'Friends', count: data.almostPlans.length },
    { id: 'communities', label: 'Communities', count: 0, isComingSoon: true },
  ];
  
  const hasPlans = data.yourPlans.length > 0;
  const hasAlmost = data.almostPlans.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Summary Chips - sticky at top, shows counts */}
      <SocialSummaryChips
        sections={sectionCounts}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />
      
      <div className="space-y-6">
        {/* Your Plans Section - always shown */}
        <div ref={plansRef} className="scroll-mt-16">
          {hasPlans ? (
            <SocialSectionA events={data.yourPlans} recentSquadIds={recentSquadIds} />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plans</h2>
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  No plans yet. Browse events and mark as &quot;Going&quot; or &quot;Interested&quot;.
                </p>
                <a 
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] text-white font-medium rounded-lg hover:bg-[var(--brand-primary-hover)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Events
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Friends Plans Section - always shown */}
        <div ref={almostRef} className="scroll-mt-16">
          {hasAlmost ? (
            <SocialSectionB events={data.almostPlans} />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Friends&apos; Plans</h2>
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  Add friends to see what events they&apos;re planning to attend.
                </p>
                <AddFriendCard variant="compact" />
              </div>
            </div>
          )}
        </div>
        
        {/* Community Section - future */}
        {/* Will be added when community data is available */}
      </div>
    </div>
  );
}
