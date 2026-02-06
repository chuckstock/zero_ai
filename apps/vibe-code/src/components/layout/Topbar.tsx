import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface TopbarProps {
  gameId: Id<"games">;
}

export default function Topbar({ gameId }: TopbarProps) {
  const game = useQuery(api.games.get, { id: gameId });

  return (
    <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">⚡ Vibe Code</h1>
        {game && (
          <span className="text-gray-400 text-sm">/ {game.name}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Share
        </button>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          Submit
        </button>
      </div>
    </div>
  );
}
