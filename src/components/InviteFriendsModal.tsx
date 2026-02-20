'use client';

import { useState, useEffect } from 'react';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

interface InviteFriendsModalProps {
  communityId: string;
  communityName: string;
  onClose: () => void;
}

export function InviteFriendsModal({ communityId, communityName, onClose }: InviteFriendsModalProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<Set<string>>(new Set());
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch(`/api/communities/${communityId}/invite`);
        if (res.ok) {
          const json = await res.json();
          setFriends(json.friends || []);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [communityId]);

  const handleInvite = async (friendId: string) => {
    setInviting((prev) => new Set(prev).add(friendId));
    try {
      const res = await fetch(`/api/communities/${communityId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to invite');
      }
      setInvited((prev) => new Set(prev).add(friendId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setInviting((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()} size="md">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Invite to {communityName}</DialogTitle>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Only friends can be invited (spam prevention)
        </p>
      </DialogHeader>

      <DialogBody>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--action-primary)] mx-auto"></div>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <p>No friends to invite</p>
            <p className="text-sm mt-1">
              All your friends are already members or invited
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 bg-[var(--surface-inset)] rounded-lg"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={getAvatarStyle(friend.id)}
                  title={getDisplayName(friend.displayName, friend.email)}
                >
                  {getInitials(friend.displayName, friend.email)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">
                    {getDisplayName(friend.displayName, friend.email)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{friend.email}</p>
                </div>
                {invited.has(friend.id) ? (
                  <span className="text-sm text-[var(--signal-going)] font-medium">✓ Invited</span>
                ) : (
                  <button
                    onClick={() => handleInvite(friend.id)}
                    disabled={inviting.has(friend.id)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-[var(--action-primary)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)] disabled:opacity-50"
                  >
                    {inviting.has(friend.id) ? '...' : 'Invite'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface-inset)] rounded-lg hover:bg-[var(--border-default)] transition-colors"
        >
          Done
        </button>
      </DialogFooter>
    </Dialog>
  );
}
