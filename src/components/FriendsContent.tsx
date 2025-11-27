'use client';

import { useState, useEffect } from 'react';
import { UserSearch } from '@/components/UserSearch';
import { FriendCard } from '@/components/FriendCard';
import { FriendRequestCard } from '@/components/FriendRequestCard';

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
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  const fetchFriends = async () => {
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
  };

  useEffect(() => {
    fetchFriends();
  }, []);

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

  const handleSendRequest = async (userId: string) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to send request');
      }
      await fetchFriends();
      setActiveTab('requests');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send request');
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'friends'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Friends {data && data.friends.length > 0 && `(${data.friends.length})`}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Requests
          {data && data.pendingReceived.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {data.pendingReceived.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'search'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Add Friends
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {data.friends.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500 mb-4">You haven't added any friends yet.</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Find Friends
                  </button>
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

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Received Requests */}
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Received ({data.pendingReceived.length})
                </h2>
                {data.pendingReceived.length === 0 ? (
                  <p className="text-gray-500 text-sm">No pending requests</p>
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

              {/* Sent Requests */}
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Sent ({data.pendingSent.length})
                </h2>
                {data.pendingSent.length === 0 ? (
                  <p className="text-gray-500 text-sm">No pending sent requests</p>
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

          {/* Search Tab */}
          {activeTab === 'search' && (
            <UserSearch
              onSendRequest={handleSendRequest}
              existingFriendIds={data.friends.map((f) => f.friend.id)}
              pendingRequestIds={[
                ...data.pendingReceived.map((r) => r.requester.id),
                ...data.pendingSent.map((r) => r.addressee.id),
              ]}
            />
          )}
        </>
      )}
    </>
  );
}

