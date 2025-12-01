'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Chip Variants:
 * - toggle: For selection states (guests, ticket options)
 * - tag: For category/filter tags with optional remove
 * - status: For status indicators (Going, Interested)
 * - info: Neutral informational chip
 * - coming-soon: Greyed out future feature
 */
type ChipVariant = 'toggle' | 'tag' | 'status' | 'info' | 'coming-soon';
type ChipSize = 'xs' | 'sm' | 'md';

/**
 * Semantic colors for chips:
 * - default: Gray (unselected/neutral)
 * - primary: Brand green (active/selected)
 * - accent: Brand primary for highlighted info
 * - category: Blue tint for category filters (legacy, will migrate)
 * - warning: Amber for "needs attention" states
 * - success: Green for confirmed states
 */
type ChipColor = 'default' | 'primary' | 'accent' | 'category' | 'warning' | 'success';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ChipVariant;
  size?: ChipSize;
  color?: ChipColor;
  active?: boolean;
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

// Color styles for each chip color in both active and inactive states
const colorStyles: Record<ChipColor, { active: string; inactive: string }> = {
  default: {
    active: 'bg-gray-200 text-gray-900',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  },
  primary: {
    active: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  },
  accent: {
    active: 'bg-[var(--brand-primary)] text-white',
    inactive: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:bg-green-200',
  },
  category: {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  },
  warning: {
    active: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  },
  success: {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  },
};

// Variant-specific styling
const variantStyles: Record<ChipVariant, string> = {
  toggle: 'rounded-full font-medium cursor-pointer transition-all',
  tag: 'rounded-full font-normal',
  status: 'rounded-md font-medium',
  info: 'rounded-full font-normal',
  'coming-soon': 'rounded-full font-normal opacity-50 cursor-not-allowed',
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({
    variant = 'toggle',
    size = 'sm',
    color = 'default',
    active = false,
    removable = false,
    onRemove,
    icon,
    children,
    disabled,
    className,
    onClick,
    ...props
  }, ref) => {
    const isClickable = variant !== 'coming-soon' && (onClick || removable);
    const isDisabled = disabled || variant === 'coming-soon';

    const colorStyle = colorStyles[color][active ? 'active' : 'inactive'];

    // For coming-soon, override to always show muted style
    const finalColorStyle = variant === 'coming-soon' 
      ? 'bg-gray-100 text-gray-400'
      : colorStyle;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
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
          'inline-flex items-center',
          sizeStyles[size],
          variantStyles[variant],
          finalColorStyle,
          isDisabled && 'cursor-not-allowed',
          !isClickable && 'cursor-default',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className={clsx(
              'ml-0.5 flex-shrink-0 hover:text-red-500 transition-colors',
              active ? 'text-current opacity-60' : 'text-gray-400'
            )}
            aria-label="Remove"
          >
            ×
          </button>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

/**
 * Convenience wrapper for toggle chips (like guest counts, ticket options)
 */
interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  color?: ChipColor;
  size?: ChipSize;
  className?: string;
  children: ReactNode;
}

export function ToggleChip({ active, onClick, disabled, color = 'primary', size = 'sm', className, children }: ToggleChipProps) {
  return (
    <Chip
      variant="toggle"
      color={color}
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
 * Convenience wrapper for removable tag chips (like selected filters)
 */
interface TagChipProps {
  onRemove: () => void;
  color?: ChipColor;
  size?: ChipSize;
  children: ReactNode;
}

export function TagChip({ onRemove, color = 'category', size = 'xs', children }: TagChipProps) {
  return (
    <Chip
      variant="tag"
      color={color}
      active={true}
      removable
      onRemove={onRemove}
      size={size}
    >
      {children}
    </Chip>
  );
}

