'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

/* ─── Types ─── */
export interface Person {
  id: string;
  displayName: string | null;
  email: string;
}

export interface PeopleGroup {
  label: string;
  /** CSS custom property value, e.g. 'var(--signal-going)' */
  color?: string;
  /** Override displayed count (defaults to people.length) */
  count?: number;
  people: Person[];
}

interface PeopleListProps {
  groups: PeopleGroup[];
  avatarSize?: 'sm' | 'md';
  linkToProfile?: boolean;
  showEmail?: boolean;
  /** Render a custom action element for each person (button, badge, etc.) */
  renderAction?: (person: Person) => ReactNode;
  emptyMessage?: string;
  emptyDetail?: string;
  className?: string;
}

/* ─── PeopleList ─── */
export function PeopleList({
  groups,
  avatarSize = 'sm',
  linkToProfile = false,
  showEmail = false,
  renderAction,
  emptyMessage = 'No people to show',
  emptyDetail,
  className,
}: PeopleListProps) {
  const totalPeople = groups.reduce((sum, g) => sum + g.people.length, 0);

  if (totalPeople === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        <p>{emptyMessage}</p>
        {emptyDetail && <p className="text-sm mt-1">{emptyDetail}</p>}
      </div>
    );
  }

  const avatarCls = avatarSize === 'md'
    ? 'w-10 h-10 text-sm'
    : 'w-8 h-8 text-xs';

  const showHeaders = groups.length > 1;

  return (
    <div className={clsx('space-y-6', className)}>
      {groups.map((group) => {
        if (group.people.length === 0) return null;

        const displayCount = group.count ?? group.people.length;

        return (
          <div key={group.label}>
            {showHeaders && (
              <h4
                className="text-sm font-semibold mb-2 flex items-center gap-2"
                style={group.color ? { color: group.color } : undefined}
              >
                {group.color && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                {displayCount} {group.label}
              </h4>
            )}

            <ul className="space-y-2">
              {group.people.map((person) => (
                <li key={person.id}>
                  <PersonRow
                    person={person}
                    avatarCls={avatarCls}
                    linkToProfile={linkToProfile}
                    showEmail={showEmail}
                    action={renderAction?.(person)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ─── PersonRow (internal) ─── */
function PersonRow({
  person,
  avatarCls,
  linkToProfile,
  showEmail,
  action,
}: {
  person: Person;
  avatarCls: string;
  linkToProfile: boolean;
  showEmail: boolean;
  action?: ReactNode;
}) {
  const avatar = (
    <div
      className={clsx(avatarCls, 'rounded-full flex items-center justify-center text-white font-medium flex-shrink-0')}
      style={getAvatarStyle(person.id)}
      title={getDisplayName(person.displayName, person.email)}
    >
      {getInitials(person.displayName, person.email)}
    </div>
  );

  const nameBlock = (
    <div className="flex-1 min-w-0">
      <span className="text-sm text-[var(--text-primary)]">
        {getDisplayName(person.displayName, person.email)}
      </span>
      {showEmail && (
        <p className="text-xs text-[var(--text-muted)] truncate">{person.email}</p>
      )}
    </div>
  );

  const content = linkToProfile ? (
    <Link
      href={`/users/${person.id}`}
      className="flex items-center gap-3 py-1 hover:bg-[var(--surface-inset)] rounded-lg -ml-2 px-2 transition-colors flex-1 min-w-0"
    >
      {avatar}
      {nameBlock}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-1 flex-1 min-w-0">
      {avatar}
      {nameBlock}
    </div>
  );

  if (action) {
    return (
      <div className="flex items-center gap-3">
        {content}
        <div className="flex-shrink-0">{action}</div>
      </div>
    );
  }

  return <>{content}</>;
}
