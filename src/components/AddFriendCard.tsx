'use client';

import { useState, useEffect } from 'react';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { UserSearch } from '@/components/UserSearch';

interface AddFriendCardProps {
  variant?: 'default' | 'compact';
  className?: string;
  onGroupCreated?: () => void;
  onSwitchToGroups?: () => void;
}

export function AddFriendCard({ variant = 'default', className = '', onGroupCreated, onSwitchToGroups }: AddFriendCardProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEmailSearch, setShowEmailSearch] = useState(false);

  useEffect(() => {
    async function fetchInviteCode() {
      try {
        const response = await fetch('/api/invites/me');
        if (response.ok) {
          const data = await response.json();
          setInviteCode(data.code);
        }
      } catch (error) {
        console.error('Failed to fetch invite code:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInviteCode();
  }, []);

  const addFriendLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${inviteCode}`
    : '';

  const handleShare = async () => {
    if (!addFriendLink) return;

    const shareText = `Add me as a friend on RyesVP so we can spot Austin events and actually make plans to go.

${addFriendLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me on RyesVP',
          text: shareText,
        });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleGroupCreated = () => {
    setShowGroupModal(false);
    onGroupCreated?.();
  };

  const handleSendRequest = async (userId: string) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to send request');
      }
      setShowEmailSearch(false);
      alert('Friend request sent!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send request');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse mb-6">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-48"></div>
      </div>
    );
  }

  if (!inviteCode) return null;

  // Compact variant - just a button
  if (variant === 'compact') {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--brand-primary)] text-white font-medium rounded-full hover:bg-[var(--brand-primary-hover)] transition-colors ${className}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        {copied ? 'Copied!' : 'Add Friends'}
      </button>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        {/* Invite One Friend Section */}
        <div className="p-4 border-l-4 border-l-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Invite a Friend
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Share your personal link or search by email
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {copied ? '✓ Link Copied!' : 'Share Link'}
            </button>
            
            <button
              onClick={() => setShowEmailSearch(!showEmailSearch)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showEmailSearch
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Find by Email
            </button>
          </div>

          {/* Email Search (expandable) */}
          {showEmailSearch && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <UserSearch
                onSendRequest={handleSendRequest}
                existingFriendIds={[]}
                pendingRequestIds={[]}
                compact
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Invite a Group Section */}
        <div className="p-4 border-l-4 border-l-blue-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Invite a Group
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Everyone who joins becomes friends with each other
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex-1 px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Create Group
            </button>
            
            {onSwitchToGroups && (
              <button
                onClick={onSwitchToGroups}
                className="flex-1 px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Groups
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </>
  );
}
