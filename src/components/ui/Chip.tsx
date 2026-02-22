'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { useHaptic } from '@/hooks/useHaptic';

/**
 * Lark Chip — monochrome, two visual states:
 * - default (outlined): `--border-visible` outline, `--lark-text-secondary`
 * - selected (filled): `--accent` bg, `--text-inverse` text
 * - alert: `--status-need-ticket` for Need Ticket state
 *
 * All color variants removed. Monochrome only.
 */
type ChipVariant = 'toggle' | 'tag' | 'status' | 'info' | 'coming-soon';
type ChipSize = 'xs' | 'sm' | 'md';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ChipVariant;
  size?: ChipSize;
  active?: boolean;
  alert?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}

const sizeStyles: Record<ChipSize, string> = {
  xs: 'px-2 py-0.5 text-xs gap-1',
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-sm gap-2',
};

const variantStyles: Record<ChipVariant, string> = {
  toggle: 'rounded-full font-medium cursor-pointer',
  tag: 'rounded-full font-normal',
  status: 'rounded-md font-medium',
  info: 'rounded-full font-normal',
  'coming-soon': 'rounded-full font-normal opacity-40 cursor-not-allowed',
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({
    variant = 'toggle',
    size = 'sm',
    active = false,
    alert = false,
    removable = false,
    onRemove,
    icon,
    children,
    disabled,
    className,
    onClick,
    ...props
  }, ref) => {
    const { light: hapticLight } = useHaptic();
    const isClickable = variant !== 'coming-soon' && (onClick || removable);
    const isDisabled = disabled || variant === 'coming-soon';

    // State styling: alert > active > default
    const stateStyle = alert
      ? 'bg-[var(--status-need-ticket)] text-white border border-[var(--status-need-ticket)]'
      : active
        ? 'bg-[var(--accent)] text-[var(--text-inverse)] border border-[var(--accent)]'
        : 'bg-transparent text-[var(--lark-text-secondary)] border border-[var(--border-visible)] hover:border-[var(--lark-text-muted)] hover:text-[var(--lark-text-primary)]';

    const finalStyle = variant === 'coming-soon'
      ? 'bg-[var(--bg-surface)] text-[var(--lark-text-muted)] border border-[var(--border-subtle)]'
      : stateStyle;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      hapticLight();
      onClick?.(e);
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        className={clsx(
          'inline-flex items-center transition-colors duration-[var(--duration-fast)]',
          'active:scale-95 transition-transform',
          sizeStyles[size],
          variantStyles[variant],
          finalStyle,
          isDisabled && 'cursor-not-allowed',
          !isClickable && 'cursor-default',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {removable && onRemove && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleRemove}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRemove(e as unknown as React.MouseEvent);
              }
            }}
            className={clsx(
              'ml-0.5 flex-shrink-0 transition-colors cursor-pointer',
              active ? 'text-current opacity-60 hover:opacity-100' : 'text-[var(--lark-text-muted)] hover:text-[var(--status-need-ticket)]'
            )}
            aria-label="Remove"
          >
            ×
          </span>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

/**
 * Convenience wrapper for toggle chips
 */
interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: ChipSize;
  className?: string;
  children: ReactNode;
}

export function ToggleChip({ active, onClick, disabled, size = 'sm', className, children }: ToggleChipProps) {
  return (
    <Chip
      variant="toggle"
      active={active}
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={className}
    >
      {children}
    </Chip>
  );
}

/**
 * Convenience wrapper for removable tag chips
 */
interface TagChipProps {
  onRemove: () => void;
  size?: ChipSize;
  children: ReactNode;
}

export function TagChip({ onRemove, size = 'xs', children }: TagChipProps) {
  return (
    <Chip
      variant="tag"
      active={true}
      removable
      onRemove={onRemove}
      size={size}
    >
      {children}
    </Chip>
  );
}
