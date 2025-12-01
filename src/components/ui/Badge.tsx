'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Badge Variants:
 * - count: Notification count badges (circular)
 * - status: Status indicators (NEW, PRESALE, SOLD OUT)
 * - label: Simple text labels
 */
type BadgeVariant = 'count' | 'status' | 'label';

/**
 * Badge Colors:
 * - default: Gray neutral
 * - primary: Brand green
 * - danger: Red (alerts, errors)
 * - warning: Amber
 * - info: Blue (legacy, will migrate)
 * - success: Green
 */
type BadgeColor = 'default' | 'primary' | 'danger' | 'warning' | 'info' | 'success';

type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
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
  className 
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
 */
interface StatusBadgeProps {
  status: 'new' | 'presale' | 'sold-out' | 'limited' | 'featured';
  size?: BadgeSize;
  className?: string;
}

const statusConfig: Record<StatusBadgeProps['status'], { label: string; color: BadgeColor }> = {
  'new': { label: 'NEW', color: 'primary' },
  'presale': { label: 'PRESALE', color: 'info' },
  'sold-out': { label: 'SOLD OUT', color: 'danger' },
  'limited': { label: 'LIMITED', color: 'warning' },
  'featured': { label: 'FEATURED', color: 'primary' },
};

export function StatusBadge({ status, size = 'xs', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="status" color={config.color} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Category Badge - for event categories
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

