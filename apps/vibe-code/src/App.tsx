import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import ThreePanelLayout from './components/layout/ThreePanelLayout';
import ChatPanel from './components/chat/ChatPanel';
import GamePreview from './components/preview/GamePreview';
import AssetsPanel from './components/assets/AssetsPanel';
import Topbar from './components/layout/Topbar';

function App() {
  const [currentGameId, setCurrentGameId] = useState<Id<"games"> | null>(null);
  const games = useQuery(api.games.list);
  const createGame = useMutation(api.games.create);

  useEffect(() => {
    // For demo: auto-create first game if none exist
    if (games && games.length === 0) {
      createGame({ name: "My First Game" }).then(setCurrentGameId);
    } else if (games && games.length > 0 && !currentGameId) {
      setCurrentGameId(games[0]._id);
    }
  }, [games, currentGameId, createGame]);

  if (!currentGameId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Vibe Code</h1>
          <p className="text-gray-400">Loading your game studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Topbar gameId={currentGameId} />
      <ThreePanelLayout
        leftPanel={<ChatPanel gameId={currentGameId} />}
        middlePanel={<GamePreview gameId={currentGameId} />}
        rightPanel={<AssetsPanel gameId={currentGameId} />}
      />
    </div>
  );
}

export default App;
