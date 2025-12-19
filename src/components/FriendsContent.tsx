'use client';

import { useState, useEffect } from 'react';
import { UserSearch } from '@/components/UserSearch';
import { FriendCard } from '@/components/FriendCard';
import { FriendRequestCard } from '@/components/FriendRequestCard';
import { ListCard } from '@/components/ListCard';
import { CreateListModal } from '@/components/CreateListModal';
import { ListDetailModal } from '@/components/ListDetailModal';
import { AddFriendCard } from '@/components/InviteLinkCard';
import { YourGroups, YourGroupsRef } from '@/components/YourGroups';
import { useRef } from 'react';

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

type ListWithCount = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  _count: { members: number };
};

export function FriendsContent() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [lists, setLists] = useState<ListWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'lists'>('friends');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const groupsRef = useRef<YourGroupsRef>(null);

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

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      if (res.ok) {
        const json = await res.json();
        setLists(json.lists || []);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchLists();
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

  const handleCreateList = async (name: string, description: string, memberIds: string[]) => {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error('Failed to create list');
      const { list } = await res.json();

      for (const friendId of memberIds) {
        await fetch(`/api/lists/${list.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId }),
        });
      }

      await fetchLists();
      setShowCreateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create list');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete list');
      await fetchLists();
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  return (
    <>
      {/* Add Friend Link Card */}
      <AddFriendCard onGroupCreated={() => groupsRef.current?.refresh()} />

      {/* Friend Groups */}
      <div className="mb-6">
        <YourGroups ref={groupsRef} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'friends'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Friends {data && data.friends.length > 0 && `(${data.friends.length})`}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
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
          onClick={() => setActiveTab('lists')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'lists'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Lists {lists.length > 0 && `(${lists.length})`}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'search'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Add
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
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
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No friends yet</h3>
                  <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
                    Add friends to see who&apos;s going to events and coordinate plans together.
                  </p>
                  <AddFriendCard variant="compact" />
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

          {/* Lists Tab */}
          {activeTab === 'lists' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full px-4 py-3 text-sm font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)] border-2 border-dashed border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                + Create New List
              </button>

              {lists.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500 mb-2">No lists yet</p>
                  <p className="text-sm text-gray-400">
                    Create lists to organize friends (e.g., "Concert Crew", "Work Friends")
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lists.map((list) => (
                    <ListCard
                      key={list.id}
                      list={list}
                      onView={() => setSelectedListId(list.id)}
                      onDelete={() => handleDeleteList(list.id)}
                    />
                  ))}
                </div>
              )}
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

      {/* Create List Modal */}
      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateList}
        />
      )}

      {/* List Detail Modal */}
      {selectedListId && (
        <ListDetailModal
          listId={selectedListId}
          onClose={() => {
            setSelectedListId(null);
            fetchLists();
          }}
        />
      )}
    </>
  );
}
