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
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="font-semibold">You&apos;re now connected!</p>
          <p className="text-sm text-emerald-100">
            You and {toast.inviterName} are now friends
          </p>
        </div>
        <button
          onClick={() => setToast({ show: false, inviterName: '' })}
          className="ml-2 text-emerald-200 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

