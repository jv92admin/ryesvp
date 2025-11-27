'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface UserEvent {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    startDateTime: string;
    venue: { name: string };
  };
}

interface FriendEvent {
  friendName: string;
  friendId: string;
  event: {
    id: string;
    title: string;
    startDateTime: string;
  };
}

interface Community {
  id: string;
  name: string;
  memberCount: number;
}

interface SocialData {
  friendCount: number;
  pendingRequests: number;
  communities: Community[];
  inviteCode: string | null;
  myEvents: UserEvent[];
  friendsEvents: FriendEvent[];
}

interface SocialSidebarProps {
  isLoggedIn: boolean;
}

export function SocialSidebar({ isLoggedIn }: SocialSidebarProps) {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [friendsRes, inviteRes, myEventsRes, friendsEventsRes, communitiesRes] = await Promise.all([
          fetch('/api/friends'),
          fetch('/api/invites/me'),
          fetch('/api/users/me/events'),
          fetch('/api/friends/events'),
          fetch('/api/communities'),
        ]);

        let friendData = { friends: [], pendingReceived: [] };
        let inviteCode = null;
        let myEvents: UserEvent[] = [];
        let friendsEvents: FriendEvent[] = [];
        let communities: Community[] = [];

        if (friendsRes.ok) {
          friendData = await friendsRes.json();
        }
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          inviteCode = inviteData.code;
        }
        if (myEventsRes.ok) {
          const eventsData = await myEventsRes.json();
          myEvents = eventsData.events || [];
        }
        if (friendsEventsRes.ok) {
          const fEventsData = await friendsEventsRes.json();
          friendsEvents = fEventsData.events || [];
        }
        if (communitiesRes.ok) {
          const commData = await communitiesRes.json();
          communities = (commData.communities || []).map((c: { id: string; name: string; _count?: { members: number } }) => ({
            id: c.id,
            name: c.name,
            memberCount: c._count?.members || 0,
          }));
        }

        setData({
          friendCount: friendData.friends?.length || 0,
          pendingRequests: friendData.pendingReceived?.length || 0,
          communities,
          inviteCode,
          myEvents,
          friendsEvents,
        });
      } catch (error) {
        console.error('Error fetching social data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isLoggedIn]);

  const handleCopyInvite = async () => {
    if (!data?.inviteCode) return;
    
    const inviteUrl = `${window.location.origin}?ref=${data.inviteCode}`;
    const shareText = `Join me on RyesVP to discover Austin events! ${inviteUrl}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">👋 Join RyesVP</h3>
          <p className="text-sm text-blue-800 mb-3">
            Sign in to see who&apos;s going and track your events
          </p>
          <Link
            href="/login"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Loading
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

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Your Network */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Your Network</h3>
        
        {/* Friends */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span className="text-sm text-gray-700">
              {data.friendCount} friend{data.friendCount !== 1 ? 's' : ''}
            </span>
            {data.pendingRequests > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                {data.pendingRequests} new
              </span>
            )}
          </div>
          <Link href="/friends" className="text-sm text-blue-600 hover:underline">
            View
          </Link>
        </div>

        {/* Communities */}
        <div className="py-2">
          {data.communities.length > 0 ? (
            <div className="space-y-2">
              {data.communities.slice(0, 3).map((community) => (
                <div key={community.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏠</span>
                    <span className="text-sm text-gray-700 truncate max-w-[140px]">
                      {community.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({community.memberCount})
                    </span>
                  </div>
                </div>
              ))}
              {data.communities.length > 3 && (
                <Link href="/communities" className="text-xs text-gray-500 hover:text-gray-700">
                  +{data.communities.length - 3} more
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <span className="text-sm text-gray-500">No communities yet</span>
              </div>
            </div>
          )}
          <Link 
            href="/communities" 
            className="mt-2 block text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            {data.communities.length > 0 ? 'Manage Communities →' : '+ Start a Community'}
          </Link>
        </div>

        {/* Invite Link */}
        <button
          onClick={handleCopyInvite}
          className="mt-2 w-full px-3 py-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors font-medium"
        >
          {copied ? '✓ Link Copied!' : '🔗 Copy Invite Link'}
        </button>
      </div>

      {/* Your Upcoming Events */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Your Events</h3>
          {data.myEvents.length > 0 && (
            <Link href="/?myEvents=true" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          )}
        </div>

        {data.myEvents.length === 0 ? (
          <p className="text-sm text-gray-500">
            No upcoming events. Browse below to find something!
          </p>
        ) : (
          <div className="space-y-2">
            {data.myEvents.slice(0, 5).map((ue) => (
              <Link
                key={ue.id}
                href={`/events/${ue.event.id}`}
                className="block p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    ue.status === 'GOING' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ue.status === 'GOING' ? '✓ Going' : '★ Interested'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {ue.event.title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatInTimeZone(new Date(ue.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Friends' Upcoming Events */}
      {data.friendCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Friends Going</h3>

          {data.friendsEvents.length === 0 ? (
            <p className="text-sm text-gray-500">
              No friends have marked events yet
            </p>
          ) : (
            <div className="space-y-2">
              {data.friendsEvents.slice(0, 5).map((fe, idx) => (
                <Link
                  key={`${fe.friendId}-${fe.event.id}-${idx}`}
                  href={`/events/${fe.event.id}`}
                  className="block p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs text-gray-500 mb-0.5">
                    {fe.friendName} is going
                  </p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {fe.event.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatInTimeZone(new Date(fe.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state - encourage building network */}
      {data.friendCount === 0 && data.communities.length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">👋 Build Your Network</h3>
          <p className="text-sm text-gray-600 mb-3">
            Add friends or join communities to see what events people are going to
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/friends"
              className="block w-full text-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Find Friends
            </Link>
            <Link
              href="/communities"
              className="block w-full text-center px-4 py-2 border border-purple-300 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              Browse Communities
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

