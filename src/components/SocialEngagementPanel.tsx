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
    const shareText = `Add me as a friend on Lark so we can spot Austin events and actually make plans to go. ${inviteUrl}`;
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Lark',
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
      <div className="bg-[var(--brand-primary-light)] border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👋</span>
          <div>
            <p className="text-green-900 font-medium">
              <Link href="/login" className="underline hover:no-underline">
                Sign in
              </Link>{' '}
              to see who&apos;s going
            </p>
            <p className="text-sm text-green-700">
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  // No stats (error or not loaded)
  if (!stats) return null;

  // New user with no friends - encourage adding friends
  if (stats.friendCount === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">👋</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Get more out of Lark
            </h3>
            <p className="text-gray-600 text-sm mb-3">
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
                className="text-[var(--brand-primary)] border-green-300 hover:bg-[var(--brand-primary-light)]"
              >
                {copied ? '✓ Copied!' : '🔗 Copy Invite Link'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has friends - show useful info
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Stats & pending items */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-gray-600">
            ✨ {stats.friendCount} friend{stats.friendCount !== 1 ? 's' : ''} connected
          </span>
          
          {stats.pendingRequests > 0 && (
            <Link
              href="/friends"
              className="flex items-center gap-1 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
            >
              📬 {stats.pendingRequests} request{stats.pendingRequests !== 1 ? 's' : ''} →
            </Link>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareInvite}
            className="px-3 py-1.5 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium transition-colors"
          >
            {copied ? '✓ Copied!' : '🔗 Invite Friends'}
          </button>
          <Link
            href="/friends"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Manage →
          </Link>
        </div>
      </div>
    </div>
  );
}

