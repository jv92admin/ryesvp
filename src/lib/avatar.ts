/**
 * Lark avatar system — flat monochrome.
 * No gradients. `--bg-surface` background + `--lark-text-secondary` initials.
 * Event imagery is the only color in the UI.
 */

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get flat monochrome style for a user avatar
export function getAvatarStyle(_userId: string): React.CSSProperties {
  return {
    background: 'var(--bg-surface)',
    color: 'var(--lark-text-secondary)',
  };
}

// Legacy function for backwards compatibility
export function getAvatarGradient(_userId: string): string {
  return '';
}

// Get initials from display name or email
export function getInitials(displayName: string | null, email?: string | null): string {
  if (displayName) {
    const parts = displayName.split(' ').filter(n => n.length > 0);
    if (parts.length > 0) {
      return parts
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
  }
  if (email && email.length > 0) {
    return email[0].toUpperCase();
  }
  return '?';
}

// Get display name or fallback to email username
export function getDisplayName(displayName: string | null, email?: string | null): string {
  if (displayName) return displayName;
  if (email && email.length > 0) return email.split('@')[0];
  return 'Unknown';
}
