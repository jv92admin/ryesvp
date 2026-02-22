'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface SocialStats {
  friendCount: number;
  pendingRequests: number;
  pendingCommunityInvites: number;
  inviteCode: string | null;
}

interface SocialEngagementPanelProps {
  isLoggedIn: boolean;
}

export function SocialEngagementPanel({ isLoggedIn }: SocialEngagementPanelProps) {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        // Fetch friends and invite code in parallel
        const [friendsRes, inviteRes] = await Promise.all([
          fetch('/api/friends'),
          fetch('/api/invites/me'),
        ]);

        let friendData = { friends: [], pendingReceived: [] };
        let inviteCode = null;

        if (friendsRes.ok) {
          friendData = await friendsRes.json();
        }
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          inviteCode = inviteData.code;
        }

        setStats({
          friendCount: friendData.friends?.length || 0,
          pendingRequests: friendData.pendingReceived?.length || 0,
          pendingCommunityInvites: 0,
          inviteCode,
        });
      } catch (error) {
        console.error('Error fetching social stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isLoggedIn]);

  const handleShareInvite = async () => {
    if (!stats?.inviteCode) return;

    const inviteUrl = `${window.location.origin}?ref=${stats.inviteCode}`;
    const shareText = `I've been using this app Lark for finding stuff to do in Austin. Way easier than scrolling Instagram stories. ${inviteUrl}`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lark',
          text: shareText,
        });
        return;
      } catch (e) {
        // User cancelled or not supported
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

  // Not logged in - prompt to sign in
  if (!isLoggedIn) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[var(--lark-text-primary)] font-medium">
              <Link href="/login" className="underline hover:no-underline">
                Sign in
              </Link>{' '}
              to see who&apos;s going
            </p>
            <p className="text-sm text-[var(--lark-text-secondary)]">
              Connect with friends and discover events together
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-4 bg-[var(--bg-surface)] rounded w-48"></div>
      </div>
    );
  }

  // No stats (error or not loaded)
  if (!stats) return null;

  // New user with no friends - encourage adding friends
  if (stats.friendCount === 0) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--lark-text-primary)] mb-1">
              Get more out of Lark
            </h3>
            <p className="text-[var(--lark-text-secondary)] text-sm mb-3">
              Add friends to see who&apos;s going to events
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/friends"
                className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                Add Friends
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShareInvite}
              >
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has friends - show useful info
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Stats & pending items */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-[var(--lark-text-secondary)]">
            {stats.friendCount} friend{stats.friendCount !== 1 ? 's' : ''} connected
          </span>

          {stats.pendingRequests > 0 && (
            <Link
              href="/friends"
              className="flex items-center gap-1 text-sm text-[var(--accent)] hover:opacity-80 font-medium"
            >
              {stats.pendingRequests} request{stats.pendingRequests !== 1 ? 's' : ''}
            </Link>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareInvite}
            className="px-3 py-1.5 text-sm text-[var(--accent)] hover:opacity-80 font-medium transition-colors"
          >
            {copied ? 'Copied!' : 'Invite Friends'}
          </button>
          <Link
            href="/friends"
            className="px-3 py-1.5 text-sm text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] transition-colors"
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
