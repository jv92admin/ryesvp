'use client';

import { useEffect, useState } from 'react';
import { redeemStoredInvite, checkAndStoreInviteRef } from '@/lib/invite';

interface InviteRedemptionResult {
  inviterName: string;
  friendshipCreated: boolean;
}

/**
 * Hook to handle invite code redemption
 * 
 * 1. On mount, checks URL for ?ref= param and stores it
 * 2. If user is logged in and has stored invite, redeems it
 * 3. Returns the result for displaying a toast/message
 */
export function useInviteRedemption(isLoggedIn: boolean) {
  const [result, setResult] = useState<InviteRedemptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check and store invite ref from URL
  useEffect(() => {
    checkAndStoreInviteRef();
  }, []);

  // Redeem invite if logged in
  useEffect(() => {
    async function redeem() {
      if (!isLoggedIn || isProcessing) return;
      
      setIsProcessing(true);
      
      const redemptionResult = await redeemStoredInvite();
      
      if (redemptionResult?.success && redemptionResult.inviterName) {
        setResult({
          inviterName: redemptionResult.inviterName,
          friendshipCreated: redemptionResult.friendshipCreated || false,
        });
      }
      
      setIsProcessing(false);
    }

    redeem();
  }, [isLoggedIn, isProcessing]);

  // Clear result after displaying
  const clearResult = () => setResult(null);

  return { result, clearResult, isProcessing };
}

