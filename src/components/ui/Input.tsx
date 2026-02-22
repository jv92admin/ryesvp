'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

/**
 * Lark Input — dark surface, subtle border, visible on focus.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[var(--lark-text-secondary)] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 text-sm rounded-lg',
            'bg-[var(--bg-surface)] text-[var(--lark-text-primary)]',
            'border placeholder:text-[var(--lark-text-muted)]',
            'transition-colors duration-[var(--duration-fast)]',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            error
              ? 'border-[var(--status-need-ticket)] focus:ring-[var(--status-need-ticket)]'
              : 'border-[var(--border-subtle)] focus:ring-[var(--border-visible)] focus:border-[var(--border-visible)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--status-need-ticket)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
