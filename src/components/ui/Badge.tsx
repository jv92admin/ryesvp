'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Lark Badge — monochrome. All badges are `--bg-surface` + `--lark-text-secondary`.
 * No colored variants. The only exception: danger uses `--status-need-ticket`.
 */
type BadgeVariant = 'count' | 'status' | 'label';
type BadgeColor = 'default' | 'danger';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  default: 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]',
  danger: 'bg-[var(--status-need-ticket)] text-white',
};

const sizeStyles: Record<BadgeVariant, Record<BadgeSize, string>> = {
  count: {
    xs: 'min-w-[16px] h-4 text-[10px] px-1',
    sm: 'min-w-[18px] h-[18px] text-xs px-1',
    md: 'min-w-[22px] h-[22px] text-xs px-1.5',
  },
  status: {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  },
  label: {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  },
};

const variantStyles: Record<BadgeVariant, string> = {
  count: 'rounded-full font-bold inline-flex items-center justify-center',
  status: 'rounded font-semibold uppercase tracking-wide',
  label: 'rounded font-medium',
};

export function Badge({
  variant = 'label',
  color = 'default',
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        variantStyles[variant],
        sizeStyles[variant][size],
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Count Badge - for notification bubbles
 */
interface CountBadgeProps {
  count: number;
  max?: number;
  color?: BadgeColor;
  size?: BadgeSize;
  className?: string;
}

export function CountBadge({ count, max = 99, color = 'danger', size = 'xs', className }: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant="count" color={color} size={size} className={className}>
      {displayCount}
    </Badge>
  );
}

/**
 * Status Badge - for event status (NEW, PRESALE, SOLD OUT)
 * All monochrome except SOLD OUT which uses danger.
 */
interface StatusBadgeInlineProps {
  status: 'new' | 'presale' | 'sold-out' | 'limited' | 'featured';
  size?: BadgeSize;
  className?: string;
}

const statusConfig: Record<StatusBadgeInlineProps['status'], { label: string; color: BadgeColor }> = {
  'new': { label: 'NEW', color: 'default' },
  'presale': { label: 'PRESALE', color: 'default' },
  'sold-out': { label: 'SOLD OUT', color: 'danger' },
  'limited': { label: 'LIMITED', color: 'default' },
  'featured': { label: 'FEATURED', color: 'default' },
};

export function StatusBadge({ status, size = 'xs', className }: StatusBadgeInlineProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="status" color={config.color} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Category Badge - monochrome
 */
interface CategoryBadgeProps {
  category: string;
  size?: BadgeSize;
  className?: string;
}

export function CategoryBadge({ category, size = 'xs', className }: CategoryBadgeProps) {
  return (
    <Badge variant="label" color="default" size={size} className={className}>
      {category}
    </Badge>
  );
}
