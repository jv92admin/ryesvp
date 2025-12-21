// Generate consistent avatar colors based on user ID or email

// Using hex colors for inline styles (Tailwind can't handle dynamic class names)
const GRADIENT_COLORS = [
  { from: '#f43f5e', to: '#db2777' }, // rose -> pink
  { from: '#f97316', to: '#d97706' }, // orange -> amber
  { from: '#eab308', to: '#84cc16' }, // yellow -> lime
  { from: '#10b981', to: '#14b8a6' }, // emerald -> teal
  { from: '#06b6d4', to: '#0ea5e9' }, // cyan -> sky
  { from: '#3b82f6', to: '#6366f1' }, // blue -> indigo
  { from: '#8b5cf6', to: '#a855f7' }, // violet -> purple
  { from: '#d946ef', to: '#ec4899' }, // fuchsia -> pink
  { from: '#ef4444', to: '#f43f5e' }, // red -> rose
  { from: '#22c55e', to: '#10b981' }, // green -> emerald
  { from: '#14b8a6', to: '#06b6d4' }, // teal -> cyan
  { from: '#6366f1', to: '#3b82f6' }, // indigo -> blue
];

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get gradient style object for a user (use with style prop)
export function getAvatarStyle(userId: string): React.CSSProperties {
  const index = hashString(userId) % GRADIENT_COLORS.length;
  const { from, to } = GRADIENT_COLORS[index];
  return {
    background: `linear-gradient(to bottom right, ${from}, ${to})`,
  };
}

// Legacy function for backwards compatibility (returns empty string now)
export function getAvatarGradient(userId: string): string {
  // Deprecated - use getAvatarStyle instead
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

