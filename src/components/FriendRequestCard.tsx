import Link from 'next/link';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

type User = {
  id: string;
  email: string;
  displayName: string | null;
};

interface FriendRequestCardProps {
  user: User;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
}

export function FriendRequestCard({ user, type, onAccept, onDecline }: FriendRequestCardProps) {
  const initials = getInitials(user.displayName, user.email);
  const avatarStyle = getAvatarStyle(user.id);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <Link href={`/users/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
          style={avatarStyle}
          title={getDisplayName(user.displayName, user.email)}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {getDisplayName(user.displayName, user.email)}
          </p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
      </Link>
      
      {type === 'received' ? (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="btn-primary px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          >
            Accept
          </button>
          <button
            onClick={onDecline}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>
        </div>
      ) : (
        <span className="text-sm text-gray-500 italic">Pending</span>
      )}
    </div>
  );
}

