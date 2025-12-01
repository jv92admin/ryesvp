type ListWithCount = {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
};

interface ListCardProps {
  list: ListWithCount;
  onView: () => void;
  onDelete: () => void;
}

export function ListCard({ list, onView, onDelete }: ListCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={onView}
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
          {list.name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900">{list.name}</p>
          <p className="text-sm text-gray-500">
            {list._count.members} {list._count.members === 1 ? 'member' : 'members'}
            {list.description && ` · ${list.description}`}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="px-3 py-1.5 text-sm font-medium text-[var(--brand-primary)] hover:bg-green-50 rounded-lg transition-colors"
        >
          View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-sm text-gray-400 hover:text-red-600 transition-colors px-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

