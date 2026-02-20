'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Button Variants:
 * - primary: Dark/black CTA — "Buy Tickets", "Create Plan", main actions
 * - secondary: White with border — "Share", "Cancel", supporting actions
 * - ghost: Text-only, minimal visual weight — inline actions
 * - danger: Red destructive — "Delete", "Leave"
 * - signal: Green for status confirmations — "Going", "RSVP" (green = signal, not brand)
 * - engage: Warm gold for social CTAs — "Start Plan", "Invite", "Add Friend"
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'signal' | 'engage';
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
    'bg-[var(--action-primary)] text-[var(--action-primary-text)]',
    'hover:bg-[var(--action-primary-hover)]',
    'focus:ring-2 focus:ring-[var(--border-strong)] focus:ring-offset-2',
    'disabled:bg-[var(--border-default)] disabled:text-[var(--text-muted)]',
  ].join(' '),
  secondary: [
    'bg-[var(--action-secondary)] text-[var(--text-primary)] border border-[var(--action-secondary-border)]',
    'hover:bg-[var(--action-secondary-hover)] hover:border-[var(--border-strong)]',
    'focus:ring-2 focus:ring-[var(--border-strong)] focus:ring-offset-2',
    'disabled:bg-[var(--surface-inset)] disabled:text-[var(--text-muted)] disabled:border-[var(--border-default)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)]',
    'focus:ring-2 focus:ring-[var(--border-strong)]',
    'disabled:text-[var(--text-muted)] disabled:bg-transparent',
  ].join(' '),
  danger: [
    'bg-[var(--signal-danger)] text-white',
    'hover:bg-[var(--signal-danger-hover)]',
    'focus:ring-2 focus:ring-[var(--signal-danger)] focus:ring-offset-2',
    'disabled:bg-[var(--border-default)] disabled:text-[var(--text-muted)]',
  ].join(' '),
  signal: [
    'bg-[var(--signal-going)] text-white',
    'hover:bg-[var(--signal-going-hover)]',
    'focus:ring-2 focus:ring-[var(--signal-going)] focus:ring-offset-2',
    'disabled:bg-[var(--border-default)] disabled:text-[var(--text-muted)]',
  ].join(' '),
  engage: [
    'bg-[var(--action-engage)] text-[var(--action-engage-text)]',
    'hover:bg-[var(--action-engage-hover)]',
    'focus:ring-2 focus:ring-[var(--action-engage)] focus:ring-offset-2',
    'disabled:bg-[var(--border-default)] disabled:text-[var(--text-muted)]',
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

