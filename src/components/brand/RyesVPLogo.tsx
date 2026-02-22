'use client';

interface RyesVPLogoProps {
  size?: number;
  className?: string;
}

/**
 * Lark Logo — the wordmark IS the logo.
 * Space Grotesk 700, near-white on dark.
 * Retained as component for backward-compat with imports.
 */
export function RyesVPLogo({ size = 48, className = '' }: RyesVPLogoProps) {
  const fontSize = size * 0.55;
  return (
    <span
      className={`inline-flex items-center justify-center font-bold text-[var(--lark-text-primary)] ${className}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        width: size,
        height: size,
      }}
      aria-label="Lark Logo"
    >
      L
    </span>
  );
}

/**
 * Lark Wordmark — "Lark" in Space Grotesk 700
 */
export function RyesVPWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-bold tracking-tight text-[var(--lark-text-primary)] ${className}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      Lark
    </span>
  );
}

/**
 * Combined Logo + Wordmark for header use
 */
export function RyesVPBrand({
  logoSize = 40,
  className = '',
}: {
  logoSize?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <RyesVPLogo size={logoSize} />
      <RyesVPWordmark className="text-2xl" />
    </div>
  );
}
