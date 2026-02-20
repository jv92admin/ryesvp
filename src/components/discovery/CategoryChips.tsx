'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ToggleChip } from '@/components/ui';

type CategoryId = 'CONCERT' | 'COMEDY' | 'THEATER' | 'SPORTS' | 'OTHER';

interface CategoryChip {
  id: CategoryId;
  label: string;
}

/**
 * @deprecated Replaced by FilterDrawer (Category section) + FilterStrip Concerts quick chip.
 * Logic inlined into FilterDrawer.tsx and FilterStrip.tsx as of Inc 2.
 * Safe to delete once verified no other imports exist.
 */
export function CategoryChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse current categories from URL
  const categoriesParam = searchParams.get('categories');
  const selectedCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : [];

  const handleChipClick = (categoryId: CategoryId) => {
    const params = new URLSearchParams(searchParams.toString());
    
    let newCategories: string[];
    if (selectedCategories.includes(categoryId)) {
      // Remove this category
      newCategories = selectedCategories.filter(c => c !== categoryId);
    } else {
      // Add this category
      newCategories = [...selectedCategories, categoryId];
    }
    
    if (newCategories.length > 0) {
      params.set('categories', newCategories.join(','));
    } else {
      params.delete('categories');
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  // Top categories for inline display
  const chips: CategoryChip[] = [
    { id: 'CONCERT', label: 'Concerts' },
    { id: 'COMEDY', label: 'Comedy' },
    { id: 'THEATER', label: 'Theater' },
    { id: 'SPORTS', label: 'Sports' },
    { id: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {chips.map((chip) => (
        <ToggleChip
          key={chip.id}
          active={selectedCategories.includes(chip.id)}
          onClick={() => handleChipClick(chip.id)}
          color="primary"
          size="sm"
        >
          {chip.label}
        </ToggleChip>
      ))}
    </div>
  );
}

