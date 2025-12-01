'use client';

import { useState, useEffect } from 'react';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New List</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-auto flex-1">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                List Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Concert Crew, Work Friends"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this list for?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Add Friends Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Friends ({selectedIds.size} selected)
              </label>
              
              {loadingFriends ? (
                <div className="text-sm text-gray-500">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  No friends yet. You can add friends after creating the list.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto border border-gray-200 rounded-lg p-2">
                  {friends.map((f) => (
                    <label
                      key={f.friend.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedIds.has(f.friend.id) ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(f.friend.id)}
                        onChange={() => toggleFriend(f.friend.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(f.friend)}
                      </div>
                      <span className="text-sm text-gray-700">
                        {f.friend.displayName || f.friend.email.split('@')[0]}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
