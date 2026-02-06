import { Trophy, Medal } from 'lucide-react'
import { formatAddress, formatEth } from '../../utils/helpers'

// Mock data - in production, fetch from API
const mockLeaderboard = [
  { rank: 1, address: '0x1234567890abcdef1234567890abcdef12345678', displayName: 'WordMaster', gamesWon: 47, winRate: 0.78, totalEarnings: BigInt(2_500_000_000_000_000_000) },
  { rank: 2, address: '0xabcdef1234567890abcdef1234567890abcdef12', displayName: 'GuesserPro', gamesWon: 42, winRate: 0.72, totalEarnings: BigInt(1_800_000_000_000_000_000) },
  { rank: 3, address: '0x7890abcdef1234567890abcdef1234567890abcd', displayName: null, gamesWon: 38, winRate: 0.69, totalEarnings: BigInt(1_200_000_000_000_000_000) },
  { rank: 4, address: '0xdef1234567890abcdef1234567890abcdef12345', displayName: 'BasedGamer', gamesWon: 35, winRate: 0.65, totalEarnings: BigInt(950_000_000_000_000_000) },
  { rank: 5, address: '0x4567890abcdef1234567890abcdef1234567890ab', displayName: null, gamesWon: 31, winRate: 0.62, totalEarnings: BigInt(780_000_000_000_000_000) },
]

export default function LeaderboardPreview() {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-tile-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-900/50 text-sm font-medium text-gray-400">
        <div className="col-span-1">#</div>
        <div className="col-span-5">Player</div>
        <div className="col-span-2 text-right">Wins</div>
        <div className="col-span-2 text-right">Win Rate</div>
        <div className="col-span-2 text-right">Earnings</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-tile-border">
        {mockLeaderboard.map((entry) => (
          <div
            key={entry.rank}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors"
          >
            {/* Rank */}
            <div className="col-span-1">
              {entry.rank === 1 ? (
                <Trophy size={18} className="text-yellow-500" />
              ) : entry.rank === 2 ? (
                <Medal size={18} className="text-gray-400" />
              ) : entry.rank === 3 ? (
                <Medal size={18} className="text-amber-700" />
              ) : (
                <span className="text-gray-500">{entry.rank}</span>
              )}
            </div>

            {/* Player */}
            <div className="col-span-5">
              <p className="text-white font-medium truncate">
                {entry.displayName || formatAddress(entry.address)}
              </p>
            </div>

            {/* Wins */}
            <div className="col-span-2 text-right text-white">
              {entry.gamesWon}
            </div>

            {/* Win Rate */}
            <div className="col-span-2 text-right">
              <span className={entry.winRate >= 0.7 ? 'text-tile-correct' : 'text-white'}>
                {(entry.winRate * 100).toFixed(0)}%
              </span>
            </div>

            {/* Earnings */}
            <div className="col-span-2 text-right text-tile-correct font-medium">
              {formatEth(entry.totalEarnings, 2)} ETH
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
