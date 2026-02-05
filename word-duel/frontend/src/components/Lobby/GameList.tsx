import { Clock, ArrowRight, Inbox } from 'lucide-react'
import { LobbyGame } from '../../types'
import { formatAddress, formatEth } from '../../utils/helpers'
import Button from '../shared/Button'

interface GameListProps {
  games: LobbyGame[]
  onJoin: (gameId: string) => void
  currentAddress?: string
}

// Mock data for development
const mockGames: LobbyGame[] = [
  {
    id: 'game-1',
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    creatorName: 'WordMaster',
    wager: BigInt(10_000_000_000_000_000),
    createdAt: Date.now() - 120000,
    status: 'open',
  },
  {
    id: 'game-2',
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    wager: BigInt(50_000_000_000_000_000),
    createdAt: Date.now() - 45000,
    status: 'open',
  },
  {
    id: 'game-3',
    creator: '0x7890abcdef1234567890abcdef1234567890abcd',
    creatorName: 'GuesserPro',
    wager: BigInt(100_000_000_000_000_000),
    createdAt: Date.now() - 180000,
    status: 'open',
  },
]

export default function GameList({ games, onJoin, currentAddress }: GameListProps) {
  // Use mock data if no games provided
  const displayGames = games.length > 0 ? games : mockGames

  if (displayGames.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox size={48} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Open Games</h3>
        <p className="text-gray-400 text-sm">
          Be the first to create a game, or try Quick Play!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {displayGames.map((game) => {
        const isOwn = currentAddress?.toLowerCase() === game.creator.toLowerCase()
        const timeAgo = getTimeAgo(game.createdAt)

        return (
          <div
            key={game.id}
            className="bg-gray-800/50 rounded-xl p-4 border border-tile-border hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Creator Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {game.creatorName || formatAddress(game.creator)}
                  {isOwn && (
                    <span className="ml-2 text-xs text-tile-correct">(You)</span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <Clock size={14} />
                  <span>{timeAgo}</span>
                </div>
              </div>

              {/* Wager */}
              <div className="text-right">
                <p className="text-xl font-bold text-tile-correct">
                  {formatEth(game.wager, 3)} ETH
                </p>
                <p className="text-xs text-gray-500">
                  Pot: {formatEth(game.wager * BigInt(2), 3)} ETH
                </p>
              </div>

              {/* Join Button */}
              <Button
                onClick={() => onJoin(game.id)}
                disabled={isOwn}
                size="sm"
                icon={<ArrowRight size={16} />}
              >
                Join
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
