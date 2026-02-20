'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';

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
    <Dialog open={true} onOpenChange={() => onClose()} size="md">
      <DialogHeader onClose={onClose}>
        <DialogTitle>{list?.name || 'Loading...'}</DialogTitle>
        {list?.description && (
          <p className="text-sm text-[var(--text-muted)] mt-1">{list.description}</p>
        )}
      </DialogHeader>

      <DialogBody>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--action-primary)] mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Add Friend Section */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddFriend(!showAddFriend)}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showAddFriend ? '− Hide' : '+ Add Friends'}
              </button>

              {showAddFriend && (
                <div className="mt-3 space-y-2">
                  {availableFriends.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">
                      All your friends are already in this list, or you have no friends yet.
                    </p>
                  ) : (
                    availableFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-2 bg-[var(--surface-inset)] rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] text-xs font-medium">
                            {getInitials(friend)}
                          </div>
                          <span className="text-sm text-[var(--text-primary)]">
                            {friend.displayName || friend.email.split('@')[0]}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddMember(friend.id)}
                          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                Members ({list?.members.length || 0})
              </h3>

              {list?.members.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No members yet. Add some friends!</p>
              ) : (
                <div className="space-y-2">
                  {list?.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] text-xs font-medium">
                          {getInitials(member.user)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {member.user.displayName || member.user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{member.user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--signal-danger)]"
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
      </DialogBody>
    </Dialog>
  );
}
