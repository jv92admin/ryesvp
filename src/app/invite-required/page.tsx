'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStoredInviteRef, getStoredGroupInvite, clearInviteData } from '@/lib/invite';

function InviteRequiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRedeeming, setAutoRedeeming] = useState(false);

  // On mount, check localStorage for stored invite code or group invite
  useEffect(() => {
    const storedCode = getStoredInviteRef();
    const groupCode = getStoredGroupInvite();

    if (storedCode) {
      setInviteCode(storedCode);
      // Auto-redeem the stored code
      setAutoRedeeming(true);
      redeemInvite(storedCode);
    } else if (groupCode) {
      // Group invite code - complete signup without friend invite
      setAutoRedeeming(true);
      completeGroupSignup(groupCode);
    } else {
      setLoading(false);
    }
  }, []);

  const redeemInvite = async (code: string) => {
    setError(null);
    setLoading(true);

    try {
      // First validate the code
      const validateRes = await fetch(`/api/invites/${code}`);
      if (!validateRes.ok) {
        const data = await validateRes.json();
        throw new Error(data.error || 'Invalid invite code');
      }

      // Create the user account with the invite code
      const createRes = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to complete signup');
      }

      // Clear the stored invite code
      clearInviteData();

      // Redirect to the app
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
      setAutoRedeeming(false);
    }
  };

  const completeGroupSignup = async (groupCode: string) => {
    setError(null);
    setLoading(true);

    try {
      // Validate the group code exists
      const validateRes = await fetch(`/api/groups/join/${groupCode}`);
      if (!validateRes.ok) {
        throw new Error('Invalid group link');
      }

      // Create the user account WITHOUT a friend invite (group invite is sufficient)
      const createRes = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupInviteCode: groupCode }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to complete signup');
      }

      // Clear the stored data
      clearInviteData();

      // Redirect to the group join page (they still need to click "Join")
      router.push(`/g/${groupCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
      setAutoRedeeming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    redeemInvite(inviteCode.trim());
  };

  if (autoRedeeming) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--lark-text-secondary)]">Setting up your account...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Simple header without auth */}
      <header className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-[var(--screen-padding)] py-4">
          <Link href="/" className="text-xl font-bold text-[var(--lark-text-primary)]">
            Lark
          </Link>
        </div>
      </header>
      <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-[var(--screen-padding)]">
        <div className="max-w-md w-full">
          <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] p-8">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--lark-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--lark-text-primary)]">Invite Required</h1>
              <p className="text-[var(--lark-text-secondary)] mt-2">
                Lark is invite-only. Enter your invite code to complete signup.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-[var(--lark-text-primary)] mb-1">
                  Invite Code
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter your invite code"
                  className="w-full px-4 py-3 border border-[var(--border-visible)] rounded-lg text-[var(--lark-text-primary)] bg-[var(--bg-primary)] placeholder:text-[var(--lark-text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-950/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full py-3 px-4 bg-[var(--accent)] text-[var(--bg-primary)] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Complete Signup'}
              </button>
            </form>

            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--lark-text-secondary)] text-center">
                Don't have an invite code?{' '}
                <span className="text-[var(--lark-text-primary)]">Ask a friend who's already on Lark!</span>
              </p>
            </div>

            {/* Browse without account */}
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] hover:underline"
              >
                Or browse events without an account →
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function InviteRequiredPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--lark-text-secondary)]">Loading...</p>
        </div>
      </main>
    }>
      <InviteRequiredContent />
    </Suspense>
  );
}
