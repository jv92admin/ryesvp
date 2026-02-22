'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Lark IconButton — monochrome variants.
 */
type IconButtonVariant = 'ghost' | 'outline' | 'solid';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] hover:bg-[var(--bg-hover)]',
  outline: 'bg-transparent text-[var(--lark-text-secondary)] border border-[var(--border-visible)] hover:border-[var(--lark-text-muted)] hover:text-[var(--lark-text-primary)]',
  solid: 'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)]',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-7 h-7 [&>svg]:w-3.5 [&>svg]:h-3.5',
  md: 'w-9 h-9 [&>svg]:w-4 [&>svg]:h-4',
  lg: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'ghost', size = 'md', disabled, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg',
          'transition-colors duration-[var(--duration-fast)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--border-visible)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
          variantStyles[variant],
          sizeStyles[size],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
