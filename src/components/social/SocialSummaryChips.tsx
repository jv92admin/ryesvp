'use client';

interface SectionCount {
  id: string;
  label: string;
  count: number;
  isComingSoon?: boolean;
}

interface SocialSummaryChipsProps {
  sections: SectionCount[];
  activeSection?: string;
  onSectionClick: (sectionId: string) => void;
}

export function SocialSummaryChips({ 
  sections, 
  activeSection,
  onSectionClick 
}: SocialSummaryChipsProps) {
  // Show all sections - users can click to see empty states
  // Coming soon sections show greyed out
  const visibleSections = sections;
  
  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none sticky top-0 bg-gray-50 z-20">
      {visibleSections.map((section) => {
        const isComingSoon = section.isComingSoon;
        const hasContent = section.count > 0;
        const isClickable = !isComingSoon; // Can click even if empty (shows empty state)
        const isSelected = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => isClickable && onSectionClick(section.id)}
            disabled={!isClickable}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              whitespace-nowrap transition-colors
              ${isSelected
                ? 'bg-[var(--brand-primary)] text-white'
                : isClickable
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title={isComingSoon ? 'Coming soon' : undefined}
          >
            <span>{section.label}</span>
            {hasContent && (
              <span className={`
                px-1.5 py-0.5 text-xs rounded-full
                ${isSelected
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {section.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

