'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { getStoredReturnUrl, getStoredInviteRef, storeInviteRef } from '@/lib/invite';

export default function LoginPage() {
  const [returnUrl, setReturnUrl] = useState('/');
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);

  // Get return URL and check for invite
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const storedReturn = getStoredReturnUrl();

    // Priority: query param > stored return URL > default
    setReturnUrl(next || storedReturn || '/');

    // Check for ?ref= param in URL and store it
    const refParam = params.get('ref');

    if (refParam) {
      storeInviteRef(refParam);
    }

    // Check for invite code (from URL or localStorage)
    async function checkInvite() {
      const ref = refParam || getStoredInviteRef();
      if (ref) {
        try {
          const response = await fetch(`/api/invites/${ref}`);
          if (response.ok) {
            const data = await response.json();
            if (data.valid) {
              setInviterName(data.inviterName);
            }
          }
        } catch (error) {
          console.error('Error checking invite:', error);
        }
      }
      setLoadingInvite(false);
    }

    checkInvite();
  }, []);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-[var(--screen-padding)]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[var(--lark-text-primary)]">
            Lark
          </Link>
          <p className="text-[var(--lark-text-secondary)] mt-2">
            Discover Austin events and go with friends
          </p>
        </div>

        {/* Invite Banner */}
        {!loadingInvite && inviterName && (
          <div className="bg-[var(--bg-surface)] text-[var(--lark-text-primary)] rounded-lg p-4 mb-4 text-center border border-[var(--border-subtle)]">
            <p className="text-lg font-semibold">
              {inviterName} invited you!
            </p>
            <p className="text-sm text-[var(--lark-text-secondary)] mt-1">
              Sign up to connect and discover events together
            </p>
          </div>
        )}

        <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border-visible)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-[var(--lark-text-primary)]">Continue with Google</span>
          </button>

          <p className="text-xs text-[var(--lark-text-secondary)] text-center mt-4">
            {inviterName
              ? `Sign up to connect with ${inviterName}`
              : 'Can\'t find your invite code? Ask a friend on Lark to add you from their Friends page.'
            }
          </p>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--lark-text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-visible)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Events
          </Link>
        </div>
      </div>
    </main>
  );
}
