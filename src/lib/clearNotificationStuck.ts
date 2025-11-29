// Utility to manually clear stuck notifications (for debugging)

/**
 * Clear all stored squad notifications from localStorage
 * Use this if notifications get stuck due to bugs
 */
export function clearAllSquadNotifications(): void {
  try {
    localStorage.removeItem('ryesvp_viewed_squads');
    console.log('✅ Cleared all squad notifications from localStorage');
  } catch (error) {
    console.error('❌ Error clearing squad notifications:', error);
  }
}

// Make it available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).clearSquadNotifications = clearAllSquadNotifications;
}
