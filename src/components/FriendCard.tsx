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
  const initials = friend.displayName
    ? friend.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : friend.email[0].toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {initials}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {friend.displayName || friend.email.split('@')[0]}
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

