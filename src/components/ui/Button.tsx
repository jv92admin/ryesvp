'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Button Variants:
 * - primary: Green "Go/Yes/Confirm" action (brand-primary)
 * - secondary: Gray outlined, neutral action
 * - ghost: Text-only, minimal visual weight
 * - danger: Red destructive action
 * - legacy-primary: Blue for gradual migration (will be removed)
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'legacy-primary';
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
    'bg-[var(--brand-primary)] text-white',
    'hover:bg-[var(--brand-primary-hover)]',
    'focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2',
    'disabled:bg-gray-300 disabled:text-gray-500',
  ].join(' '),
  secondary: [
    'bg-white text-gray-700 border border-gray-300',
    'hover:bg-gray-50 hover:border-gray-400',
    'focus:ring-2 focus:ring-gray-300 focus:ring-offset-2',
    'disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200',
  ].join(' '),
  ghost: [
    'bg-transparent text-gray-600',
    'hover:text-gray-900 hover:bg-gray-100',
    'focus:ring-2 focus:ring-gray-300',
    'disabled:text-gray-300 disabled:bg-transparent',
  ].join(' '),
  danger: [
    'bg-[var(--brand-danger)] text-white',
    'hover:bg-[var(--brand-danger-hover)]',
    'focus:ring-2 focus:ring-[var(--brand-danger)] focus:ring-offset-2',
    'disabled:bg-gray-300 disabled:text-gray-500',
  ].join(' '),
  // Temporary: For files not yet migrated - matches old blue-600 style
  'legacy-primary': [
    'bg-blue-600 text-white',
    'hover:bg-blue-700',
    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:bg-gray-300 disabled:text-gray-500',
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
          'font-medium transition-colors focus:outline-none',
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

