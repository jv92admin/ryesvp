type User = {
  id: string;
  email: string;
  displayName: string | null;
};

type CommunityMembership = {
  id: string;
  listId: string;
  list: {
    id: string;
    name: string;
    description: string | null;
    owner: User;
  };
};

interface CommunityInviteCardProps {
  invitation: CommunityMembership;
  onAccept: () => void;
  onDecline: () => void;
}

export function CommunityInviteCard({ invitation, onAccept, onDecline }: CommunityInviteCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
          {invitation.list.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{invitation.list.name}</p>
          <p className="text-sm text-gray-500">
            Invited by {invitation.list.owner.displayName || invitation.list.owner.email.split('@')[0]}
          </p>
          {invitation.list.description && (
            <p className="text-sm text-gray-600 mt-1">{invitation.list.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

