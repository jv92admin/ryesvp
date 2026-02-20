'use client';

interface RyesVPLogoProps {
  size?: number;
  className?: string;
}

/**
 * RyesVP Square Logo
 * 
 * The "Tucked Y" design: The Y becomes a checkmark (✓), visually teaching users
 * "When you see RyesVP, you check the box. You say yes."
 * 
 * - R, V, P in brand-black (#171717)
 * - Y as checkmark in brand-primary green (#16A34A)
 */
export function RyesVPLogo({ size = 48, className = '' }: RyesVPLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size}
      className={className}
      aria-label="Lark Logo"
    >
      {/* White background with rounded corners */}
      <rect 
        width="100" 
        height="100" 
        rx="18" 
        fill="#FFFFFF"
        stroke="var(--brand-border, #E5E5E5)"
        strokeWidth="1"
      />
      
      {/* R - Top left */}
      <text 
        x="16" 
        y="52" 
        fontFamily="var(--font-geist-sans), system-ui, sans-serif" 
        fontWeight="700" 
        fontSize="38" 
        fill="var(--brand-black, #171717)"
      >
        R
      </text>
      
      {/* Y as Checkmark - Top right */}
      {/* The checkmark stroke + stem that forms a stylized Y */}
      <path 
        d="M52 28 L62 40 L80 16" 
        stroke="var(--brand-primary, #16A34A)" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stem of the Y extending down */}
      <path 
        d="M62 40 L62 52" 
        stroke="var(--brand-primary, #16A34A)" 
        strokeWidth="7" 
        strokeLinecap="round"
        fill="none"
      />
      
      {/* V - Bottom left */}
      <text 
        x="16" 
        y="88" 
        fontFamily="var(--font-geist-sans), system-ui, sans-serif" 
        fontWeight="700" 
        fontSize="38" 
        fill="var(--brand-black, #171717)"
      >
        V
      </text>
      
      {/* P - Bottom right */}
      <text 
        x="54" 
        y="88" 
        fontFamily="var(--font-geist-sans), system-ui, sans-serif" 
        fontWeight="700" 
        fontSize="38" 
        fill="var(--brand-black, #171717)"
      >
        P
      </text>
    </svg>
  );
}

/**
 * RyesVP Wordmark - The text "RyesVP" with styled Y
 * For use alongside the logo or standalone
 */
export function RyesVPWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-bold tracking-tight ${className}`}
      style={{ color: 'var(--text-primary, #171717)' }}
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
  className = '' 
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

