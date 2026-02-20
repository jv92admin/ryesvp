/**
 * RyesVP Shared UI Components
 * 
 * Central exports for design system components.
 * Import from '@/components/ui' for consistent styling.
 * 
 * Usage:
 *   import { Button, Chip, Badge } from '@/components/ui';
 */

// Buttons
export { Button } from './Button';

// Chips / Pills
export { Chip, ToggleChip, TagChip } from './Chip';

// Badges
export { Badge, CountBadge, StatusBadge, CategoryBadge } from './Badge';

// Dialog
export { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogContent } from './dialog';

// Icon Button
export { IconButton } from './IconButton';

// Input
export { Input } from './Input';

// People List
export { PeopleList } from './PeopleList';
export type { Person, PeopleGroup } from './PeopleList';
