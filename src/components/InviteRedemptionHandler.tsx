'use client';

import { useEffect, useState } from 'react';
import { redeemStoredInvite } from '@/lib/invite';

/**
 * Client component that handles invite redemption after login.
 * Shows a toast when successfully connected with inviter.
 */
export function InviteRedemptionHandler() {
  const [toast, setToast] = useState<{ show: boolean; inviterName: string }>({
    show: false,
    inviterName: '',
  });
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only running after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Wait for hydration to complete

    async function redeem() {
      const result = await redeemStoredInvite();
      
      if (result?.success && result.inviterName) {
        setToast({
          show: true,
          inviterName: result.inviterName,
        });
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setToast({ show: false, inviterName: '' });
        }, 5000);
      }
    }

    redeem();
  }, [mounted]);

  if (!mounted || !toast.show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[var(--accent)] text-[var(--text-inverse)] px-6 py-4 rounded-lg flex items-center gap-3">
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-semibold">You&apos;re now connected!</p>
          <p className="text-sm opacity-80">
            You and {toast.inviterName} are now friends
          </p>
        </div>
        <button
          onClick={() => setToast({ show: false, inviterName: '' })}
          className="ml-2 opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

