'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

type FriendInfo = {
  friendship: { id: string };
  friend: User;
};

interface CreateListModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, memberIds: string[]) => void;
}

export function CreateListModal({ onClose, onCreate }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch('/api/friends');
        if (res.ok) {
          const json = await res.json();
          setFriends(json.friends || []);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, []);

  const toggleFriend = (friendId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(friendId)) {
      newSet.delete(friendId);
    } else {
      newSet.add(friendId);
    }
    setSelectedIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onCreate(name.trim(), description.trim(), Array.from(selectedIds));
    setLoading(false);
  };

  const getInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
        <DialogHeader onClose={onClose}>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                List Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Concert Crew, Work Friends"
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this list for?"
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Add Friends ({selectedIds.size} selected)
              </label>

              {loadingFriends ? (
                <div className="text-sm text-[var(--text-muted)]">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)] bg-[var(--surface-inset)] p-3 rounded-lg">
                  No friends yet. You can add friends after creating the list.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto border border-[var(--border-default)] rounded-lg p-2">
                  {friends.map((f) => (
                    <label
                      key={f.friend.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedIds.has(f.friend.id) ? 'bg-[var(--surface-inset)] border border-[var(--border-strong)]' : 'hover:bg-[var(--surface-inset)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(f.friend.id)}
                        onChange={() => toggleFriend(f.friend.id)}
                        className="w-4 h-4 text-[var(--action-primary)] border-[var(--border-default)] rounded focus:ring-[var(--border-strong)]"
                      />
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-secondary)] text-xs font-medium">
                        {getInitials(f.friend)}
                      </div>
                      <span className="text-sm text-[var(--text-primary)]">
                        {f.friend.displayName || f.friend.email.split('@')[0]}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[var(--action-primary)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create List'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
