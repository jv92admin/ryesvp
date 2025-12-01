'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface Friend {
  id: string;
  displayName: string;
  email: string;
  status: string | null;
  isInterested: boolean;
  squadId: string | null;
  squadMemberNames: string;
  hasSquad: boolean;
}

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  venue: {
    name: string;
  };
}

interface SquadCreationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSquadCreated: (squadId: string) => void;
}

export function SquadCreationModal({ event, isOpen, onClose, onSquadCreated }: SquadCreationModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningSquad, setJoiningSquad] = useState<string | null>(null);

  // Fetch friends when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchFriends() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/events/${event.id}/friends`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }

        const data = await response.json();
        setFriends(data.friends);

        // Auto-select friends who are already interested
        const interestedFriendIds = new Set<string>(
          data.friends
            .filter((f: Friend) => f.isInterested)
            .map((f: Friend) => f.id)
        );
        setSelectedFriends(interestedFriendIds);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Failed to load friends');
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [isOpen, event.id]);

  const handleFriendToggle = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleJoinSquad = async (squadId: string, friendName: string) => {
    if (joiningSquad) return;
    
    setJoiningSquad(squadId);
    setError(null);

    try {
      const response = await fetch(`/api/squads/${squadId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body for self-join
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join squad');
      }

      // Close modal and redirect to squad
      onClose();
      onSquadCreated(squadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join squad');
      setJoiningSquad(null);
    }
  };

  const handleCreateSquad = async () => {
    setCreating(true);
    setError(null);

    try {
      // Create the squad
      const squadResponse = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      });

      if (!squadResponse.ok) {
        const errorData = await squadResponse.json();
        throw new Error(errorData.error || 'Failed to create squad');
      }

      const squadData = await squadResponse.json();
      const squadId = squadData.squad.id;

      // Add selected friends to the squad
      const invitePromises = Array.from(selectedFriends).map(friendId =>
        fetch(`/api/squads/${squadId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: friendId }),
        })
      );

      await Promise.all(invitePromises);

      onSquadCreated(squadId);
      onClose();
    } catch (err) {
      console.error('Error creating squad:', err);
      setError(err instanceof Error ? err.message : 'Failed to create squad');
    } finally {
      setCreating(false);
    }
  };

  const interestedFriends = friends.filter(f => f.isInterested);
  const otherFriends = friends.filter(f => !f.isInterested);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Start a plan
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Event Info */}
          <div className="text-center border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-1">
              {event.title}
            </h3>
            <p className="text-sm text-gray-600">
              {formatInTimeZone(new Date(event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
              {' • '}
              {event.venue.name}
            </p>
          </div>

          {loading && (
            <div className="py-4 text-center text-gray-500">
              Loading friends...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Who do you want to invite? ({selectedFriends.size} selected)
                </h4>

                {friends.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No friends to invite yet.</p>
                    <p className="text-xs mt-1">Add friends to coordinate with them!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {/* Interested Friends First */}
                    {interestedFriends.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-2">
                          Already Interested
                        </h5>
                        <div className="space-y-2">
                          {interestedFriends.map((friend) => (
                            friend.hasSquad ? (
                              <FriendSquadCard
                                key={friend.id}
                                friend={friend}
                                onJoinSquad={handleJoinSquad}
                                isJoining={joiningSquad === friend.squadId}
                              />
                            ) : (
                              <FriendCheckbox
                                key={friend.id}
                                friend={friend}
                                isSelected={selectedFriends.has(friend.id)}
                                onToggle={() => handleFriendToggle(friend.id)}
                              />
                            )
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
                            friend.hasSquad ? (
                              <FriendSquadCard
                                key={friend.id}
                                friend={friend}
                                onJoinSquad={handleJoinSquad}
                                isJoining={joiningSquad === friend.squadId}
                              />
                            ) : (
                              <FriendCheckbox
                                key={friend.id}
                                friend={friend}
                                isSelected={selectedFriends.has(friend.id)}
                                onToggle={() => handleFriendToggle(friend.id)}
                              />
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={creating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateSquad}
                  disabled={creating}
                  loading={creating}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : `Start Plan${selectedFriends.size > 0 ? ` (${selectedFriends.size + 1})` : ''}`}
                </Button>
              </div>
            </>
          )}
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

interface FriendSquadCardProps {
  friend: Friend;
  onJoinSquad: (squadId: string, friendName: string) => void;
  isJoining: boolean;
}

function FriendCheckbox({ friend, isSelected, onToggle }: FriendCheckboxProps) {
  const getStatusBadge = () => {
    if (!friend.status) return null;

    const statusConfig = {
      INTERESTED: { emoji: '★', color: 'bg-amber-100 text-amber-700' },
      GOING: { emoji: '✓', color: 'bg-green-100 text-green-700' },
      NEED_TICKETS: { emoji: '🔍', color: 'bg-amber-50 text-amber-600' },
      HAVE_TICKETS: { emoji: '🎫', color: 'bg-green-100 text-green-700' },
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
      isSelected ? 'bg-[var(--brand-primary-light)] border border-green-200' : 'hover:bg-gray-50'
    }`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="w-4 h-4 text-[var(--brand-primary)] border-gray-300 rounded focus:ring-green-500"
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

function FriendSquadCard({ friend, onJoinSquad, isJoining }: FriendSquadCardProps) {
  const getStatusBadge = () => {
    if (!friend.status) return null;

    const statusConfig = {
      INTERESTED: { emoji: '★', color: 'bg-amber-100 text-amber-700' },
      GOING: { emoji: '✓', color: 'bg-green-100 text-green-700' },
      NEED_TICKETS: { emoji: '🔍', color: 'bg-amber-50 text-amber-600' },
      HAVE_TICKETS: { emoji: '🎫', color: 'bg-green-100 text-green-700' },
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
    <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--brand-primary-light)] border border-green-200">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
          {friend.displayName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">
              {friend.displayName}
            </span>
            {getStatusBadge()}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            In a plan with {friend.squadMemberNames}
          </div>
        </div>
      </div>
      
      <Button
        variant="primary"
        size="xs"
        onClick={() => friend.squadId && onJoinSquad(friend.squadId, friend.displayName)}
        disabled={isJoining || !friend.squadId}
        loading={isJoining}
      >
        {isJoining ? 'Joining...' : 'Join Plan'}
      </Button>
    </div>
  );
}
