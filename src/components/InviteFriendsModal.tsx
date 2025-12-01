'use client';

import { useState, useEffect } from 'react';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Invite to {communityName}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Only friends can be invited (spam prevention)
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No friends to invite</p>
              <p className="text-sm text-gray-400 mt-1">
                All your friends are already members or invited
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={getAvatarStyle(friend.id)}
                    title={getDisplayName(friend.displayName, friend.email)}
                  >
                    {getInitials(friend.displayName, friend.email)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getDisplayName(friend.displayName, friend.email)}
                    </p>
                    <p className="text-xs text-gray-500">{friend.email}</p>
                  </div>
                  {invited.has(friend.id) ? (
                    <span className="text-sm text-green-600 font-medium">✓ Invited</span>
                  ) : (
                    <button
                      onClick={() => handleInvite(friend.id)}
                      disabled={inviting.has(friend.id)}
                      className="btn-primary px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {inviting.has(friend.id) ? '...' : 'Invite'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

