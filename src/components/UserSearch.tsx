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
  compact?: boolean;
}

export function UserSearch({ onSendRequest, existingFriendIds, pendingRequestIds, compact = false }: UserSearchProps) {
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
      <div className={`flex gap-2 ${compact ? 'mb-3' : 'mb-6'}`}>
        <input
          type="email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={compact ? "Search by email..." : "Enter exact email address..."}
          className={`flex-1 border border-[var(--border-visible)] rounded-lg text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-[var(--bg-primary)] ${compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}
        />
        <button
          onClick={handleSearch}
          disabled={query.length < 3 || loading}
          className={`btn-primary font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <div className={`text-center bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] ${compact ? 'py-4' : 'py-8'}`}>
          <p className="text-[var(--lark-text-secondary)] text-sm">No user found with &quot;{query}&quot;</p>
          {!compact && (
            <p className="text-sm text-[var(--lark-text-muted)] mt-1">
              Enter the exact email address of the person you want to add
            </p>
          )}
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
                className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-4 flex items-center justify-between"
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
                    <p className="font-medium text-[var(--lark-text-primary)]">
                      {getDisplayName(user.displayName, user.email)}
                    </p>
                    <p className="text-sm text-[var(--lark-text-secondary)]">{user.email}</p>
                  </div>
                </div>

                {state === 'friend' && (
                  <span className="text-sm text-[var(--accent)] font-medium">Friends</span>
                )}
                {state === 'pending' && (
                  <span className="text-sm text-[var(--lark-text-secondary)] italic">Pending</span>
                )}
                {state === 'add' && (
                  <button
                    onClick={() => onSendRequest(user.id)}
                    className="btn-primary px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!searched && !compact && (
        <div className="text-center py-8 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
          <p className="text-[var(--lark-text-secondary)]">Enter a friend&apos;s email address</p>
          <p className="text-sm text-[var(--lark-text-muted)] mt-1">
            You&apos;ll need their exact email to find them
          </p>
        </div>
      )}
    </div>
  );
}
