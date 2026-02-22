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
    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--lark-text-primary)] font-bold text-lg">
          {invitation.list.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[var(--lark-text-primary)]">{invitation.list.name}</p>
          <p className="text-sm text-[var(--lark-text-secondary)]">
            Invited by {invitation.list.owner.displayName || invitation.list.owner.email.split('@')[0]}
          </p>
          {invitation.list.description && (
            <p className="text-sm text-[var(--lark-text-secondary)] mt-1">{invitation.list.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onAccept}
          className="flex-1 btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="flex-1 px-4 py-2 text-sm font-medium text-[var(--lark-text-secondary)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
