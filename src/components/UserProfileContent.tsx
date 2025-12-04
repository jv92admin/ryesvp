'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import { formatEventDate } from '@/lib/utils';
import { StartPlanModal } from './StartPlanModal';

interface UserProfile {
  id: string;
  displayName: string | null;
  email: string;
  createdAt: string;
  relation: 'self' | 'friend' | 'pending_sent' | 'pending_received' | 'stranger';
  friendshipId: string | null;
  friendsSince: string | null;
  mutualFriendCount: number;
  mutualFriends: { id: string; displayName: string | null }[];
  friendCount: number;
}

interface UserEvent {
  id: string;
  title: string;
  displayTitle: string;
  startDateTime: string;
  imageUrl: string | null;
  venue: { id: string; name: string };
  status: 'GOING' | 'INTERESTED';
  isMutual: boolean;
}

interface ProfileData {
  profile: UserProfile;
  events: { going: UserEvent[]; interested: UserEvent[] } | null;
  mutualEvents: UserEvent[] | null;
}

interface UserProfileContentProps {
  userId: string;
}

export function UserProfileContent({ userId }: UserProfileContentProps) {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStartPlan, setShowStartPlan] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
        return;
      }
      const profileData = await res.json();
      setData(profileData);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleFriendAction = async (action: 'send' | 'accept' | 'decline' | 'cancel') => {
    if (!data) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          friendshipId: data.profile.friendshipId 
        }),
      });

      if (res.ok) {
        // Refresh profile data
        await fetchProfile();
      }
    } catch (err) {
      console.error('Friend action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!data?.profile.friendshipId) return;
    
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/users/${userId}?friendshipId=${data.profile.friendshipId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        await fetchProfile();
      }
    } catch (err) {
      console.error('Remove friend failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
            <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">{error || 'Something went wrong'}</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 text-[var(--brand-primary)] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const { profile, events, mutualEvents } = data;
  const displayName = getDisplayName(profile.displayName, profile.email);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Profile Header */}
      <div className="text-center mb-8">
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-semibold shadow-lg"
          style={getAvatarStyle(profile.id)}
        >
          {getInitials(profile.displayName, profile.email)}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {displayName}
        </h1>

        {/* Member since (friends only) */}
        {(profile.relation === 'friend' || profile.relation === 'self') && (
          <p className="text-sm text-gray-500 mb-4">
            Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}
          </p>
        )}

        {/* Friendship Actions */}
        <div className="mt-4">
          <FriendshipActions
            relation={profile.relation}
            friendshipId={profile.friendshipId}
            friendsSince={profile.friendsSince}
            onAction={handleFriendAction}
            onRemove={handleRemoveFriend}
            loading={actionLoading}
          />
        </div>

        {/* Mutual Friends */}
        {profile.relation === 'friend' && profile.mutualFriendCount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {profile.mutualFriends.slice(0, 3).map((friend) => (
                <Link
                  key={friend.id}
                  href={`/users/${friend.id}`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={getAvatarStyle(friend.id)}
                  title={getDisplayName(friend.displayName, '')}
                >
                  {getInitials(friend.displayName, '')}
                </Link>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {profile.mutualFriendCount} mutual friend{profile.mutualFriendCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Content based on relationship */}
      {profile.relation === 'friend' ? (
        <FriendContent
          profile={profile}
          events={events!}
          mutualEvents={mutualEvents || []}
          onStartPlan={() => setShowStartPlan(true)}
        />
      ) : (
        <StrangerContent displayName={displayName} />
      )}

      {/* Start Plan Modal */}
      <StartPlanModal
        isOpen={showStartPlan}
        onClose={() => setShowStartPlan(false)}
        preSelectedFriendId={userId}
      />
    </div>
  );
}

// Friendship action buttons
function FriendshipActions({
  relation,
  friendshipId,
  friendsSince,
  onAction,
  onRemove,
  loading,
}: {
  relation: string;
  friendshipId: string | null;
  friendsSince: string | null;
  onAction: (action: 'send' | 'accept' | 'decline' | 'cancel') => void;
  onRemove: () => void;
  loading: boolean;
}) {
  const buttonBase = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50";
  const primaryBtn = `${buttonBase} bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]`;
  const outlineBtn = `${buttonBase} border border-gray-300 text-gray-700 hover:bg-gray-50`;
  const disabledBtn = `${buttonBase} bg-gray-100 text-gray-500 cursor-default`;

  switch (relation) {
    case 'stranger':
      return (
        <button
          onClick={() => onAction('send')}
          disabled={loading}
          className={primaryBtn}
        >
          {loading ? 'Sending...' : 'Add Friend'}
        </button>
      );

    case 'pending_sent':
      return (
        <div className="flex flex-col items-center gap-2">
          <span className={disabledBtn}>
            ✓ Request Sent
          </span>
          <button
            onClick={() => onAction('cancel')}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel Request
          </button>
        </div>
      );

    case 'pending_received':
      return (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onAction('accept')}
            disabled={loading}
            className={primaryBtn}
          >
            Accept
          </button>
          <button
            onClick={() => onAction('decline')}
            disabled={loading}
            className={outlineBtn}
          >
            Decline
          </button>
        </div>
      );

    case 'friend':
      return (
        <div className="flex flex-col items-center gap-2">
          {friendsSince && (
            <span className="text-sm text-gray-600">
              ✓ Friends since {format(new Date(friendsSince), 'MMM yyyy')}
            </span>
          )}
          <button
            onClick={onRemove}
            disabled={loading}
            className={outlineBtn}
          >
            Remove Friend
          </button>
        </div>
      );

    default:
      return null;
  }
}

// Content for friends
function FriendContent({
  profile,
  events,
  mutualEvents,
  onStartPlan,
}: {
  profile: UserProfile;
  events: { going: UserEvent[]; interested: UserEvent[] };
  mutualEvents: UserEvent[];
  onStartPlan: () => void;
}) {
  const displayName = getDisplayName(profile.displayName, profile.email);
  const firstName = displayName.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Start Plan CTA */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <button
          onClick={onStartPlan}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--brand-primary)] text-white rounded-lg font-medium hover:bg-[var(--brand-primary-hover)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Start a Plan with {firstName}
        </button>
      </div>

      {/* Mutual Events (highlighted) */}
      {mutualEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-[var(--brand-primary)]">✨</span>
            You're Both Interested In
          </h2>
          <div className="space-y-3">
            {mutualEvents.map((event) => (
              <EventListItem key={event.id} event={event} highlighted />
            ))}
          </div>
        </section>
      )}

      {/* Their Plans */}
      {events.going.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {firstName}'s Plans ({events.going.length})
          </h2>
          <div className="space-y-3">
            {events.going.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Their Interests */}
      {events.interested.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Interested In ({events.interested.length})
          </h2>
          <div className="space-y-3">
            {events.interested.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {events.going.length === 0 && events.interested.length === 0 && mutualEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>{firstName} hasn't marked any upcoming events yet.</p>
        </div>
      )}
    </div>
  );
}

// Compact event list item
function EventListItem({ event, highlighted }: { event: UserEvent; highlighted?: boolean }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors
        ${highlighted 
          ? 'bg-[var(--brand-primary-light)] border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)]/40' 
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {/* Event Image */}
      {event.imageUrl ? (
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={event.imageUrl} 
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <span className="text-xl">📅</span>
        </div>
      )}

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {event.displayTitle}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {event.venue.name} • {formatEventDate(new Date(event.startDateTime))}
        </p>
      </div>

      {/* Mutual badge */}
      {highlighted && (
        <span className="flex-shrink-0 px-2 py-1 bg-[var(--brand-primary)] text-white text-xs font-medium rounded-full">
          Mutual
        </span>
      )}
    </Link>
  );
}

// Content for strangers (not friends)
function StrangerContent({ displayName }: { displayName: string }) {
  return (
    <div className="bg-gray-100 rounded-xl p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="text-gray-600">
        Add <span className="font-medium">{displayName}</span> as a friend to see their upcoming events and plans.
      </p>
    </div>
  );
}

