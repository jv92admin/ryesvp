'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { checkAndStoreInviteRef } from '@/lib/invite';

interface InviteBannerProps {
  isLoggedIn: boolean;
}

export function InviteBanner({ isLoggedIn }: InviteBannerProps) {
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkInvite() {
      // Store invite ref if present in URL
      const ref = checkAndStoreInviteRef();
      
      
      if (!ref) {
        setLoading(false);
        return;
      }

      // Validate the invite code to get inviter name
      try {
        const response = await fetch(`/api/invites/${ref}`);
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setInviterName(data.inviterName);
          }
        }
      } catch (error) {
        console.error('Error validating invite:', error);
      }
      
      setLoading(false);
    }

    checkInvite();
  }, []);

  // Don't show if logged in (redemption handled elsewhere)
  if (isLoggedIn) return null;
  
  // Don't show if loading or no invite
  if (loading || !inviterName) return null;

  return (
    <div className="bg-[var(--bg-elevated)] text-[var(--lark-text-primary)] rounded-lg p-4 mb-6 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[var(--lark-text-muted)]" style={{ fontFamily: 'var(--font-display)' }}>L</span>
          <div>
            <p className="font-semibold">
              {inviterName} invited you to Lark!
            </p>
            <p className="text-sm text-[var(--lark-text-secondary)]">
              Sign up to connect and track events together
            </p>
          </div>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(window.location.pathname)}`}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--text-inverse)] font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

