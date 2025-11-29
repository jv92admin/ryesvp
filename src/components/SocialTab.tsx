'use client';

import { useState, useEffect } from 'react';
import { SocialSectionA } from './social/SocialSectionA';
import { SocialSectionB } from './social/SocialSectionB';
import { SocialSectionC } from './social/SocialSectionC';
import { CommunitySoonStub } from './social/CommunitySoonStub';
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

export function SocialTab() {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchSocialData() {
      try {
        const response = await fetch('/api/social');
        if (!response.ok) {
          if (response.status === 401) {
            // Not logged in - this is ok, just show empty states
            setData({ yourPlans: [], almostPlans: [], ticketActivity: [] });
            return;
          }
          throw new Error(`Failed to fetch social data: ${response.statusText}`);
        }
        
        const socialData = await response.json();
        setData(socialData);
      } catch (err) {
        console.error('Error fetching social data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load social data');
      } finally {
        setLoading(false);
      }
    }

    fetchSocialData();
  }, []);
  
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
  
  return (
    <div className="space-y-6">
      {/* Desktop: 3-Column Layout, Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Your Plans */}
        <div className="lg:col-span-1">
          <SocialSectionA events={data.yourPlans} />
        </div>
        
        {/* Column 2: Almost Plans */}
        <div className="lg:col-span-1">
          <SocialSectionB events={data.almostPlans} />
        </div>
        
        {/* Column 3: Coming Soon Stub */}
        <div className="lg:col-span-1">
          <CommunitySoonStub />
        </div>
      </div>
    </div>
  );
}
