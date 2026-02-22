'use client';

/**
 * Light haptic feedback for interactive elements.
 * Uses the Vibration API where available (mobile browsers).
 * No-ops gracefully on desktop or unsupported browsers.
 */
export function useHaptic() {
  const light = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const medium = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  return { light, medium };
}
