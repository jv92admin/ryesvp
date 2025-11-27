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
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
          {initials}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {user.displayName || user.email.split('@')[0]}
          </p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      
      {type === 'received' ? (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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

