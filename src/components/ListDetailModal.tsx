'use client';

import { useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

type ListMember = {
  id: string;
  userId: string;
  user: User;
};

type ListDetail = {
  id: string;
  name: string;
  description: string | null;
  members: ListMember[];
};

interface ListDetailModalProps {
  listId: string;
  onClose: () => void;
}

export function ListDetailModal({ listId, onClose }: ListDetailModalProps) {
  const [list, setList] = useState<ListDetail | null>(null);
  const [availableFriends, setAvailableFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (!res.ok) throw new Error('Failed to fetch list');
      const json = await res.json();
      setList(json.list);
    } catch (err) {
      console.error('Error fetching list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFriends = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}/members`);
      if (!res.ok) throw new Error('Failed to fetch friends');
      const json = await res.json();
      setAvailableFriends(json.friends || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  useEffect(() => {
    fetchList();
    fetchAvailableFriends();
  }, [listId]);

  const handleAddMember = async (friendId: string) => {
    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) throw new Error('Failed to add member');
      await fetchList();
      await fetchAvailableFriends();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/lists/${listId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove member');
      await fetchList();
      await fetchAvailableFriends();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const getInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{list?.name || 'Loading...'}</h2>
              {list?.description && (
                <p className="text-sm text-gray-500 mt-1">{list.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Add Friend Section */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAddFriend(!showAddFriend)}
                  className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
                >
                  {showAddFriend ? '− Hide' : '+ Add Friends'}
                </button>
                
                {showAddFriend && (
                  <div className="mt-3 space-y-2">
                    {availableFriends.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        All your friends are already in this list, or you have no friends yet.
                      </p>
                    ) : (
                      availableFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                              {getInitials(friend)}
                            </div>
                            <span className="text-sm text-gray-700">
                              {friend.displayName || friend.email.split('@')[0]}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddMember(friend.id)}
                            className="text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Members ({list?.members.length || 0})
                </h3>
                
                {list?.members.length === 0 ? (
                  <p className="text-sm text-gray-500">No members yet. Add some friends!</p>
                ) : (
                  <div className="space-y-2">
                    {list?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-medium">
                            {getInitials(member.user)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.user.displayName || member.user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500">{member.user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-xs text-gray-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

