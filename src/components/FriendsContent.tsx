'use client';

import { useState, useEffect, useCallback } from 'react';
import { FriendCard } from '@/components/FriendCard';
import { FriendRequestCard } from '@/components/FriendRequestCard';
import { AddFriendCard } from '@/components/AddFriendCard';
import { GroupsTab } from '@/components/GroupsTab';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

type FriendInfo = {
  friendship: {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: string;
    createdAt: string;
  };
  friend: User;
};

type FriendRequest = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
  requester: User;
  addressee: User;
};

type FriendsData = {
  friends: FriendInfo[];
  pendingReceived: FriendRequest[];
  pendingSent: FriendRequest[];
  pendingCount: number;
};

export function FriendsContent() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'requests'>('friends');
  const [groupsKey, setGroupsKey] = useState(0);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch('/api/friends');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch friends');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleAccept = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });
      if (!res.ok) throw new Error('Failed to accept request');
      await fetchFriends();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });
      if (!res.ok) throw new Error('Failed to decline request');
      await fetchFriends();
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove friend');
      await fetchFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  const handleGroupCreated = () => {
    setGroupsKey((k) => k + 1);
    setActiveTab('groups');
  };

  return (
    <>
      {/* Add Friend Card */}
      <AddFriendCard
        onGroupCreated={handleGroupCreated}
        onSwitchToGroups={() => setActiveTab('groups')}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-surface)] p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'friends'
              ? 'bg-[var(--bg-elevated)] text-[var(--lark-text-primary)]'
              : 'text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]'
          }`}
        >
          Friends {data && data.friends.length > 0 && `(${data.friends.length})`}
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'groups'
              ? 'bg-[var(--bg-elevated)] text-[var(--lark-text-primary)]'
              : 'text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]'
          }`}
        >
          Groups
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
            activeTab === 'requests'
              ? 'bg-[var(--bg-elevated)] text-[var(--lark-text-primary)]'
              : 'text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]'
          }`}
        >
          Requests
          {data && data.pendingReceived.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {data.pendingReceived.length}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto"></div>
          <p className="text-[var(--lark-text-secondary)] mt-4">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {data.friends.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-surface)] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--lark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--lark-text-primary)] mb-1">Your crew starts here.</h3>
                  <p className="text-[var(--lark-text-secondary)] text-sm mb-4 max-w-xs mx-auto">
                    Share your link or create a group to start building your crew.
                  </p>
                </div>
              ) : (
                data.friends.map((f) => (
                  <FriendCard
                    key={f.friendship.id}
                    friend={f.friend}
                    onRemove={() => handleRemove(f.friendship.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <GroupsTab key={groupsKey} />
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-[var(--lark-text-secondary)] uppercase tracking-wide mb-3">
                  Received ({data.pendingReceived.length})
                </h2>
                {data.pendingReceived.length === 0 ? (
                  <p className="text-[var(--lark-text-secondary)] text-sm">No pending requests</p>
                ) : (
                  <div className="space-y-3">
                    {data.pendingReceived.map((req) => (
                      <FriendRequestCard
                        key={req.id}
                        user={req.requester}
                        type="received"
                        onAccept={() => handleAccept(req.id)}
                        onDecline={() => handleDecline(req.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-sm font-semibold text-[var(--lark-text-secondary)] uppercase tracking-wide mb-3">
                  Sent ({data.pendingSent.length})
                </h2>
                {data.pendingSent.length === 0 ? (
                  <p className="text-[var(--lark-text-secondary)] text-sm">No pending sent requests</p>
                ) : (
                  <div className="space-y-3">
                    {data.pendingSent.map((req) => (
                      <FriendRequestCard
                        key={req.id}
                        user={req.addressee}
                        type="sent"
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
