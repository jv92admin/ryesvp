'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InviteFriendsModal } from '@/components/InviteFriendsModal';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

type ListMember = {
  id: string;
  userId: string;
  isVisible: boolean;
  user: User;
  invitedBy: User | null;
};

type CommunityDetail = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: User;
  members: ListMember[];
  _count: { members: number };
};

type Membership = {
  id: string;
  isVisible: boolean;
  role: string;
};

type CommunityEvent = {
  id: string;
  title: string;
  startDateTime: string;
  venue: { name: string };
  goingCount: number;
  interestedCount: number;
  visibleAttendees: Array<{
    user: { id: string; displayName: string | null; email: string };
    status: string;
  }>;
};

type EventsData = {
  events: CommunityEvent[];
  stats: { going: number; interested: number; totalEvents: number };
  userIsVisible: boolean;
};

interface CommunityDetailContentProps {
  communityId: string;
}

export function CommunityDetailContent({ communityId }: CommunityDetailContentProps) {
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'members'>('events');

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (res.status === 403) {
          setError('You are not a member of this community');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch community');
      }
      const json = await res.json();
      setCommunity(json.community);
      setIsOwner(json.isOwner);
      setMembership(json.membership);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/events`);
      if (res.ok) {
        const json = await res.json();
        setEventsData(json);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchCommunity();
    fetchEvents();
  }, [communityId]);

  const handleToggleVisibility = async () => {
    if (!membership) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !membership.isVisible }),
      });
      if (!res.ok) throw new Error('Failed to update visibility');
      // Refresh both community data and events to reflect new visibility
      await Promise.all([fetchCommunity(), fetchEvents()]);
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to leave community');
      }
      window.location.href = '/communities';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave community');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this community? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete community');
      window.location.href = '/communities';
    } catch (err) {
      console.error('Error deleting community:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error || 'Community not found'}
        </div>
        <Link href="/communities" className="text-[var(--brand-primary)] hover:underline">
          ← Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href="/communities" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to Communities
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
            {community.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
            <p className="text-gray-500">
              {community._count.members} {community._count.members === 1 ? 'member' : 'members'}
              {' · '}
              Created by {community.owner.displayName || community.owner.email.split('@')[0]}
            </p>
            {community.description && (
              <p className="text-gray-600 mt-2">{community.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          >
            Invite Friends
          </button>
          
          {membership && (
            <button
              onClick={handleToggleVisibility}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                membership.isVisible
                  ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  : 'text-amber-700 bg-amber-100 hover:bg-amber-200'
              }`}
            >
              {membership.isVisible ? '👁 Visible' : '👁‍🗨 Hidden'}
            </button>
          )}

          {isOwner ? (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
            >
              Delete Community
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Visibility explanation */}
      {membership && !membership.isVisible && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          <strong>You're hidden</strong> – Other members can't see which events you're attending. 
          You also can't see their names (only counts). Toggle visibility to participate fully.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'events'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming Events {eventsData && eventsData.stats.totalEvents > 0 && `(${eventsData.stats.totalEvents})`}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Members ({community._count.members})
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {!eventsData || eventsData.events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No upcoming events with members attending</p>
              <p className="text-sm text-gray-400 mt-1">
                Mark yourself as "Going" to events and they'll appear here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventsData.events.map((event) => {
                const eventDate = new Date(event.startDateTime);
                const canSeeNames = eventsData.userIsVisible && event.visibleAttendees.length > 0;
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}
                          {event.venue.name}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        {event.goingCount > 0 && (
                          <p className="text-green-600 font-medium">{event.goingCount} going</p>
                        )}
                        {event.interestedCount > 0 && (
                          <p className="text-amber-600">{event.interestedCount} interested</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Attendee avatars - only shown if user is visible (reciprocity) */}
                    {canSeeNames ? (
                      <div className="flex items-center gap-1 mt-3" onClick={(e) => e.preventDefault()}>
                        <div className="flex -space-x-2">
                          {event.visibleAttendees.slice(0, 5).map((a, i) => (
                            <Link
                              key={i}
                              href={`/users/${a.user.id}`}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:ring-2 hover:ring-[var(--brand-primary)] hover:ring-offset-1 transition-shadow"
                              style={getAvatarStyle(a.user.id)}
                              title={`View ${getDisplayName(a.user.displayName, a.user.email)}'s profile`}
                            >
                              {getInitials(a.user.displayName, a.user.email)}
                            </Link>
                          ))}
                        </div>
                        {event.visibleAttendees.length > 5 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{event.visibleAttendees.length - 5} more
                          </span>
                        )}
                      </div>
                    ) : !eventsData.userIsVisible && (event.goingCount + event.interestedCount) > 0 ? (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        Toggle visibility to see who's going
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-3">
            {/* Owner first */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Link
                href={`/users/${community.owner.id}`}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 hover:ring-2 hover:ring-[var(--brand-primary)] hover:ring-offset-1 transition-shadow"
                style={getAvatarStyle(community.owner.id)}
                title={`View ${getDisplayName(community.owner.displayName, community.owner.email)}'s profile`}
              >
                {getInitials(community.owner.displayName, community.owner.email)}
              </Link>
              <Link href={`/users/${community.owner.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <p className="font-medium text-gray-900 truncate">
                  {community.owner.displayName || community.owner.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{community.owner.email}</p>
              </Link>
              <span className="text-xs font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)] px-2 py-1 rounded flex-shrink-0">
                Owner
              </span>
            </div>

            {/* Other members */}
            {community.members
              .filter((m) => m.userId !== community.ownerId)
              .map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <Link
                  href={`/users/${member.user.id}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 hover:ring-2 hover:ring-[var(--brand-primary)] hover:ring-offset-1 transition-shadow"
                  style={getAvatarStyle(member.user.id)}
                  title={`View ${getDisplayName(member.user.displayName, member.user.email)}'s profile`}
                >
                  {getInitials(member.user.displayName, member.user.email)}
                </Link>
                <Link href={`/users/${member.user.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="font-medium text-gray-900 truncate">
                    {member.user.displayName || member.user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {member.invitedBy
                      ? `Invited by ${member.invitedBy.displayName || member.invitedBy.email.split('@')[0]}`
                      : member.user.email}
                  </p>
                </Link>
                {!member.isVisible && (
                  <span className="text-xs text-gray-400 flex-shrink-0">Hidden</span>
                )}
              </div>
              ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          communityId={communityId}
          communityName={community.name}
          onClose={() => {
            setShowInviteModal(false);
            fetchCommunity();
          }}
        />
      )}
    </div>
  );
}

