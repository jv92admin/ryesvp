'use client';

import Link from 'next/link';
import { getAvatarStyle, getInitials } from '@/lib/avatar';

export interface FriendForStack {
  id: string;
  displayName: string | null;
  email?: string | null;
}

interface FriendAvatarStackProps {
  friends: FriendForStack[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
  linkToProfiles?: boolean;
  className?: string;
}

/**
 * Compact avatar stack for showing friends going/interested
 * - 1-3 friends: Shows individual avatars
 * - 4+ friends: Shows maxVisible avatars + "+N" overflow
 * - Click opens modal (via onClick prop) or links to profiles
 * 
 * Used in: EventCard, FriendsAndStatusCard, SocialSectionA, SocialSectionB
 */
export function FriendAvatarStack({
  friends,
  maxVisible = 3,
  size = 'sm',
  onClick,
  linkToProfiles = false,
  className = '',
}: FriendAvatarStackProps) {
  if (friends.length === 0) return null;

  const visibleFriends = friends.slice(0, maxVisible);
  const overflowCount = friends.length - maxVisible;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
  };

  const avatarSize = sizeClasses[size];
  const overflowSize = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';

  const renderAvatar = (friend: FriendForStack, index: number) => {
    const avatarStyle = getAvatarStyle(friend.id);
    const initials = getInitials(friend.displayName, friend.email);
    
    const avatar = (
      <div
        key={friend.id}
        className={`${avatarSize} rounded-full flex items-center justify-center text-white font-medium border-2 border-white shadow-sm`}
        style={{ ...avatarStyle, marginLeft: index > 0 ? '-0.375rem' : 0 }}
        title={friend.displayName || friend.email || 'Friend'}
      >
        {initials}
      </div>
    );

    if (linkToProfiles) {
      return (
        <Link
          key={friend.id}
          href={`/users/${friend.id}`}
          className="hover:scale-110 transition-transform relative z-10"
          style={{ zIndex: visibleFriends.length - index }}
          onClick={(e) => e.stopPropagation()}
        >
          {avatar}
        </Link>
      );
    }

    return (
      <div key={friend.id} style={{ zIndex: visibleFriends.length - index }}>
        {avatar}
      </div>
    );
  };

  const content = (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {visibleFriends.map((friend, index) => renderAvatar(friend, index))}
        {overflowCount > 0 && (
          <div
            className={`${overflowSize} rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium border-2 border-white shadow-sm`}
            style={{ marginLeft: '-0.375rem' }}
          >
            +{overflowCount}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="hover:opacity-80 transition-opacity"
        type="button"
      >
        {content}
      </button>
    );
  }

  return content;
}

