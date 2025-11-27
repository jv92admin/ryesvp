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
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={avatarStyle}
          title={getDisplayName(friend.displayName, friend.email)}
        >
          {initials}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {getDisplayName(friend.displayName, friend.email)}
          </p>
          <p className="text-sm text-gray-500">{friend.email}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
      >
        Remove
      </button>
    </div>
  );
}

