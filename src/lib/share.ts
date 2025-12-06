/**
 * Smart Share Utility
 * Uses native Web Share API on mobile, falls back to clipboard on desktop
 */

export interface ShareData {
  title?: string;
  text: string;
  url?: string;
}

export interface ShareResult {
  method: 'native' | 'clipboard' | 'cancelled';
  success: boolean;
}

/**
 * Check if Web Share API is available
 * Typically available on mobile browsers (iOS Safari, Android Chrome)
 */
export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Smart share function
 * - Mobile: Opens native share sheet
 * - Desktop: Copies to clipboard
 * 
 * @returns ShareResult indicating what happened
 */
export async function smartShare(data: ShareData): Promise<ShareResult> {
  // Try native share first (mobile)
  if (canUseNativeShare()) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return { method: 'native', success: true };
    } catch (err) {
      // User cancelled the share sheet
      if ((err as Error).name === 'AbortError') {
        return { method: 'cancelled', success: false };
      }
      // Other error - fall through to clipboard
      console.warn('Native share failed, falling back to clipboard:', err);
    }
  }

  // Fallback: clipboard copy
  try {
    const textToCopy = data.url ? `${data.text}\n\n${data.url}` : data.text;
    await navigator.clipboard.writeText(textToCopy);
    return { method: 'clipboard', success: true };
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return { method: 'clipboard', success: false };
  }
}

/**
 * Share with toast feedback
 * Convenience wrapper that handles common toast patterns
 */
export async function shareWithFeedback(
  data: ShareData,
  showToast: (opts: { message: string; type: 'success' | 'error' | 'info' }) => void
): Promise<boolean> {
  const result = await smartShare(data);

  if (result.method === 'cancelled') {
    // User cancelled - no feedback needed
    return false;
  }

  if (result.success) {
    if (result.method === 'clipboard') {
      showToast({ message: 'Copied to clipboard!', type: 'success' });
    }
    // Native share doesn't need toast - the OS handles feedback
    return true;
  } else {
    showToast({ message: 'Failed to share', type: 'error' });
    return false;
  }
}

