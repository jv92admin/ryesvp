'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

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
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 text-sm rounded-lg',
            'bg-[var(--surface-card)] text-[var(--text-primary)]',
            'border placeholder:text-[var(--text-muted)]',
            'transition-shadow duration-[var(--duration-fast)]',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            error
              ? 'border-[var(--signal-danger)] focus:ring-[var(--signal-danger)]'
              : 'border-[var(--border-default)] focus:ring-[var(--action-primary)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--signal-danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
