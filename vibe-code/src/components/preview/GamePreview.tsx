import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Phaser from 'phaser';
import { RotateCcw, Maximize } from 'lucide-react';

interface GamePreviewProps {
  gameId: Id<"games">;
}

export default function GamePreview({ gameId }: GamePreviewProps) {
  const game = useQuery(api.games.get, { id: gameId });
  const assets = useQuery(api.assets.listByGame, { gameId });
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!game || !assets || !containerRef.current) return;

    // Destroy existing game
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
    }

    // Create Phaser game config
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: game.config.width,
      height: game.config.height,
      backgroundColor: game.config.backgroundColor,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: function(this: Phaser.Scene) {
          // Load all assets
          assets.forEach((asset) => {
            if (asset.type === 'image') {
              this.load.image(asset.name, asset.url);
            }
          });
        },
        create: function(this: Phaser.Scene) {
          try {
            // Execute user's game code
            // Wrap in function to provide clean scope
            const userCode = new Function('scene', game.code);
            userCode.call(this, this);
          } catch (error) {
            console.error('Game code execution error:', error);
            this.add.text(
              game.config.width / 2,
              game.config.height / 2,
              'Error in game code\nCheck console',
              {
                fontSize: '16px',
                color: '#ff0000',
                align: 'center',
              }
            ).setOrigin(0.5);
          }
        },
      },
    };

    // Create new Phaser game
    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [game, assets]);

  const handleRestart = () => {
    if (phaserGameRef.current) {
      phaserGameRef.current.scene.scenes.forEach((scene) => {
        scene.scene.restart();
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Game Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRestart}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Restart Game"
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {/* Game canvas container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          ref={containerRef}
          className="border-4 border-gray-700 rounded-lg overflow-hidden shadow-2xl"
        />
      </div>

      {game && (
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          {game.config.width}x{game.config.height} · {assets?.length || 0} assets
        </div>
      )}
    </div>
  );
}
