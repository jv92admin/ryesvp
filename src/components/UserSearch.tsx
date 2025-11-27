'use client';

import { useState } from 'react';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

interface UserSearchProps {
  onSendRequest: (userId: string) => void;
  existingFriendIds: string[];
  pendingRequestIds: string[];
}

export function UserSearch({ onSendRequest, existingFriendIds, pendingRequestIds }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.length < 3) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      setResults(json.users || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getButtonState = (userId: string): 'friend' | 'pending' | 'add' => {
    if (existingFriendIds.includes(userId)) return 'friend';
    if (pendingRequestIds.includes(userId)) return 'pending';
    return 'add';
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter exact email address..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={query.length < 3 || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No user found with email "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">
            Enter the exact email address of the person you want to add
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((user) => {
            const state = getButtonState(user.id);
            const initials = getInitials(user.displayName, user.email);
            const avatarStyle = getAvatarStyle(user.id);

            return (
              <div
                key={user.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={avatarStyle}
                    title={getDisplayName(user.displayName, user.email)}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {getDisplayName(user.displayName, user.email)}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                {state === 'friend' && (
                  <span className="text-sm text-green-600 font-medium">✓ Friends</span>
                )}
                {state === 'pending' && (
                  <span className="text-sm text-gray-500 italic">Pending</span>
                )}
                {state === 'add' && (
                  <button
                    onClick={() => onSendRequest(user.id)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!searched && (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Enter a friend's email address</p>
          <p className="text-sm text-gray-400 mt-1">
            You'll need their exact email to find them
          </p>
        </div>
      )}
    </div>
  );
}

