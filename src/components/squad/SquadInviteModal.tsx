'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Friends to Squad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="text-center py-6 text-gray-500">
              <div className="animate-pulse">Loading friends...</div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Select friends to invite ({selectedFriends.size} selected)
              </h4>

              {friends.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No more friends to invite!</p>
                  <p className="text-xs mt-1">Everyone is already in the squad or not friends yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {/* Interested Friends First */}
                  {interestedFriends.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                        <span>✨</span>
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
                        <h5 className="text-sm font-medium text-gray-700 mb-2 mt-4">
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

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={inviting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={inviting || selectedFriends.size === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {inviting ? 'Inviting...' : `Invite${selectedFriends.size > 0 ? ` (${selectedFriends.size})` : ''}`}
            </button>
          </div>
        </div>
      </DialogContent>
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
      INTERESTED: { emoji: '★', color: 'bg-amber-100 text-amber-700' },
      GOING: { emoji: '✓', color: 'bg-green-100 text-green-700' },
      NEED_TICKETS: { emoji: '🔍', color: 'bg-blue-100 text-blue-700' },
      HAVE_TICKETS: { emoji: '🎫', color: 'bg-purple-100 text-purple-700' },
    };

    const config = statusConfig[friend.status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${config.color}`}>
        {config.emoji}
      </span>
    );
  };

  return (
    <label className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
    }`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
      />
      
      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
          {friend.displayName.charAt(0).toUpperCase()}
        </div>
        
        <span className="text-sm text-gray-900 flex-1">
          {friend.displayName}
        </span>
        
        {getStatusBadge()}
      </div>
    </label>
  );
}
