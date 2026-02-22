'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Lark Button Variants (monochrome):
 * - primary: Near-white accent CTA — "Get Started", "Save", main actions
 * - secondary: Outlined with visible border — "Share", "Cancel", supporting actions
 * - ghost: Text-only, minimal visual weight — inline actions
 * - danger: Red destructive — "Delete", "Leave" (the only chromatic color)
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--accent)] text-[var(--text-inverse)]',
    'hover:bg-[var(--accent-hover)]',
    'focus:ring-2 focus:ring-[var(--border-visible)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
    'disabled:bg-[var(--accent-muted)] disabled:text-[var(--lark-text-muted)]',
  ].join(' '),
  secondary: [
    'bg-transparent text-[var(--lark-text-primary)] border border-[var(--border-visible)]',
    'hover:bg-[var(--bg-hover)] hover:border-[var(--lark-text-muted)]',
    'focus:ring-2 focus:ring-[var(--border-visible)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
    'disabled:bg-transparent disabled:text-[var(--lark-text-muted)] disabled:border-[var(--border-subtle)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--lark-text-secondary)]',
    'hover:text-[var(--lark-text-primary)] hover:bg-[var(--bg-hover)]',
    'focus:ring-2 focus:ring-[var(--border-visible)]',
    'disabled:text-[var(--lark-text-muted)] disabled:bg-transparent',
  ].join(' '),
  danger: [
    'bg-[var(--status-need-ticket)] text-white',
    'hover:brightness-110',
    'focus:ring-2 focus:ring-[var(--status-need-ticket)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
    'disabled:bg-[var(--accent-muted)] disabled:text-[var(--lark-text-muted)]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    children,
    loading = false,
    disabled,
    className,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'font-medium transition-colors duration-[var(--duration-fast)] focus:outline-none',
          'inline-flex items-center justify-center gap-2',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
