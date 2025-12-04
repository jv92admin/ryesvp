import Link from 'next/link';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

interface FriendCardProps {
  friend: User;
  onRemove: () => void;
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const initials = getInitials(friend.displayName, friend.email);
  const avatarStyle = getAvatarStyle(friend.id);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <Link href={`/users/${friend.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
          style={avatarStyle}
          title={getDisplayName(friend.displayName, friend.email)}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {getDisplayName(friend.displayName, friend.email)}
          </p>
          <p className="text-sm text-gray-500 truncate">{friend.email}</p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors ml-3 flex-shrink-0"
      >
        Remove
      </button>
    </div>
  );
}

