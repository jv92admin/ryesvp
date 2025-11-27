// Client-side invite code handling

const INVITE_REF_KEY = 'ryesvp_invite_ref';
const INVITE_RETURN_URL_KEY = 'ryesvp_invite_return_url';

/**
 * Store invite ref code before OAuth redirect
 * Called when user lands on page with ?ref= param
 */
export function storeInviteRef(code: string, returnUrl?: string) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(INVITE_REF_KEY, code);
  if (returnUrl) {
    localStorage.setItem(INVITE_RETURN_URL_KEY, returnUrl);
  }
}

/**
 * Get stored invite ref code
 */
export function getStoredInviteRef(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(INVITE_REF_KEY);
}

/**
 * Get stored return URL
 */
export function getStoredReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(INVITE_RETURN_URL_KEY);
}

/**
 * Clear stored invite data after redemption
 */
export function clearInviteData() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(INVITE_REF_KEY);
  localStorage.removeItem(INVITE_RETURN_URL_KEY);
}

/**
 * Check URL for ref param and store it
 * Returns the ref code if found
 */
export function checkAndStoreInviteRef(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  
  if (ref) {
    storeInviteRef(ref, window.location.pathname);
  }
  
  return ref;
}

/**
 * Redeem stored invite code
 * Called after user logs in
 */
export async function redeemStoredInvite(): Promise<{
  success: boolean;
  inviterName?: string;
  friendshipCreated?: boolean;
} | null> {
  const ref = getStoredInviteRef();
  
  if (!ref) return null;
  
  try {
    const response = await fetch(`/api/invites/${ref}/redeem`, {
      method: 'POST',
    });
    
    const data = await response.json();
    
    // Clear stored data regardless of result
    clearInviteData();
    
    return data;
  } catch (error) {
    console.error('Error redeeming invite:', error);
    clearInviteData();
    return null;
  }
}

/**
 * Generate an invite link for an event
 */
export function generateInviteLink(eventId: string, inviteCode: string): string {
  if (typeof window === 'undefined') return '';
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/events/${eventId}?ref=${inviteCode}`;
}

