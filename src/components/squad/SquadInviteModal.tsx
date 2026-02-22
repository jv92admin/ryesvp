'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';

interface Friend {
  id: string;
  displayName: string;
  email: string;
  status: string | null;
  isInterested: boolean;
}

interface SquadMember {
  id: string;
  userId: string;
  user: {
    displayName: string | null;
    email: string;
  };
}

interface Squad {
  id: string;
  eventId: string;
  members: SquadMember[];
}

interface SquadInviteModalProps {
  squad: Squad;
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export function SquadInviteModal({ squad, isOpen, onClose, onMemberAdded }: SquadInviteModalProps) {
  const { showToast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchFriends() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${squad.eventId}/friends`);
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }

        const data = await response.json();

        // Filter out friends who are already in the squad
        const existingMemberIds = new Set(squad.members.map(m => m.userId));
        const availableFriends = data.friends.filter((f: Friend) => !existingMemberIds.has(f.id));

        setFriends(availableFriends);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Failed to load friends');
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [isOpen, squad.eventId, squad.members]);

  const handleFriendToggle = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleInvite = async () => {
    if (inviting || selectedFriends.size === 0) return;

    setInviting(true);
    setError(null);

    try {
      // Add each selected friend to the squad
      const invitePromises = Array.from(selectedFriends).map(async (friendId) => {
        const response = await fetch(`/api/squads/${squad.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: friendId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to invite friend');
        }

        return response.json();
      });

      await Promise.all(invitePromises);

      // Show success toast
      const friendCount = selectedFriends.size;
      const friendNames = friends
        .filter(f => selectedFriends.has(f.id))
        .map(f => f.displayName)
        .slice(0, 2)
        .join(' and ');

      showToast({
        message: friendCount === 1
          ? `${friendNames} has been added to your plan and notified.`
          : friendCount === 2
          ? `${friendNames} have been added to your plan and notified.`
          : `${friendCount} friends have been added to your plan and notified.`,
        type: 'success',
        action: {
          label: 'Copy link',
          onClick: () => {
            navigator.clipboard.writeText(`${window.location.origin}/squads/${squad.id}`);
          }
        }
      });

      // Success - close modal and refresh
      onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite friends');
      setInviting(false);
    }
  };

  // Split friends into interested and others
  const interestedFriends = friends.filter(f => f.isInterested);
  const otherFriends = friends.filter(f => !f.isInterested);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} size="md">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Invite Friends to Your Plan</DialogTitle>
      </DialogHeader>

      <DialogBody className="space-y-4">
        {loading && (
          <div className="text-center py-6 text-[var(--lark-text-muted)]">
            <div className="animate-pulse">Loading friends...</div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-[var(--status-need-ticket)]/10 border border-[var(--status-need-ticket)]/20 rounded-lg text-[var(--status-need-ticket)] text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div>
            <h4 className="font-medium text-[var(--lark-text-primary)] mb-3">
              Select friends to invite ({selectedFriends.size} selected)
            </h4>

            {friends.length === 0 ? (
              <div className="text-center py-6 text-[var(--lark-text-muted)]">
                <p className="text-sm">No more friends to invite!</p>
                <p className="text-xs mt-1">Everyone is already in the plan or not friends yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {/* Interested Friends First */}
                {interestedFriends.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-[var(--accent)] mb-2">
                      Already Interested
                    </h5>
                    <div className="space-y-2">
                      {interestedFriends.map((friend) => (
                        <FriendCheckbox
                          key={friend.id}
                          friend={friend}
                          isSelected={selectedFriends.has(friend.id)}
                          onToggle={() => handleFriendToggle(friend.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Friends */}
                {otherFriends.length > 0 && (
                  <div>
                    {interestedFriends.length > 0 && (
                      <h5 className="text-sm font-medium text-[var(--lark-text-secondary)] mb-2 mt-4">
                        Other Friends
                      </h5>
                    )}
                    <div className="space-y-2">
                      {otherFriends.map((friend) => (
                        <FriendCheckbox
                          key={friend.id}
                          friend={friend}
                          isSelected={selectedFriends.has(friend.id)}
                          onToggle={() => handleFriendToggle(friend.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogBody>

      {/* Action Buttons */}
      <DialogFooter>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={inviting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleInvite}
          disabled={inviting || selectedFriends.size === 0}
          loading={inviting}
          className="flex-1"
        >
          {inviting ? 'Inviting...' : `Invite${selectedFriends.size > 0 ? ` (${selectedFriends.size})` : ''}`}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface FriendCheckboxProps {
  friend: Friend;
  isSelected: boolean;
  onToggle: () => void;
}

function FriendCheckbox({ friend, isSelected, onToggle }: FriendCheckboxProps) {
  const getStatusBadge = () => {
    if (!friend.status) return null;

    const statusConfig = {
      INTERESTED: { label: '★', color: 'bg-[var(--lark-text-secondary)]/10 text-[var(--lark-text-secondary)]' },
      GOING: { label: '✓', color: 'bg-[var(--accent)]/10 text-[var(--accent)]' },
      NEED_TICKETS: { label: '?', color: 'bg-[var(--lark-text-secondary)]/10 text-[var(--lark-text-secondary)]' },
      HAVE_TICKETS: { label: '✓', color: 'bg-[var(--accent)]/10 text-[var(--accent)]' },
    };

    const config = statusConfig[friend.status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
      isSelected
        ? 'bg-[var(--accent)]/10 border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
        : 'border-[var(--border-subtle)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)]'
    }`}>
      {/* Custom Checkbox */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-medium text-[var(--lark-text-muted)] flex-shrink-0">
          {friend.displayName.charAt(0).toUpperCase()}
        </div>

        <span className="text-sm font-medium text-[var(--lark-text-primary)] flex-1 truncate">
          {friend.displayName}
        </span>

        {getStatusBadge()}
      </div>
    </label>
  );
}
