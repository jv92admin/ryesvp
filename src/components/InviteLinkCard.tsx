'use client';

import { useState, useEffect } from 'react';

interface AddFriendCardProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function InviteLinkCard({ variant = 'default', className = '' }: AddFriendCardProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [usedCount, setUsedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInviteCode() {
      try {
        const response = await fetch('/api/invites/me');
        if (response.ok) {
          const data = await response.json();
          setInviteCode(data.code);
          setUsedCount(data.usedCount || 0);
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

    const shareText = `Add me as a friend on RyesVP! We can discover Austin events together.

${addFriendLink}`;

    // Try native share first (works on mobile + some desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me on RyesVP',
          text: shareText,
        });
        return;
      } catch (e) {
        // User cancelled or not supported, fall back to clipboard
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4 animate-pulse ${variant === 'default' ? 'mb-6' : ''} ${className}`}>
        <div className="h-5 bg-green-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-green-100 rounded w-48"></div>
      </div>
    );
  }

  if (!inviteCode) return null;

  // Compact variant for inline use (matches filter chip sizing)
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
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 ${variant === 'default' ? 'mb-6' : ''} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Your Add Friend Link</h3>
            {usedCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-full">
                {usedCount} friend{usedCount !== 1 ? 's' : ''} added
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Share this link and you&apos;ll become friends automatically!
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2">
            <code className="flex-1 text-sm text-gray-700 truncate">
              {addFriendLink}
            </code>
            <button
              onClick={handleShare}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
              }`}
            >
              {copied ? '✓ Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Also export as AddFriendCard for clearer naming
export { InviteLinkCard as AddFriendCard };

