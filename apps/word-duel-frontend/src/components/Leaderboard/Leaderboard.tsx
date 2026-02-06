import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Trophy, Medal, Crown, TrendingUp, Coins } from 'lucide-react'
import { TimeFilter, LeaderboardEntry } from '../../types'
import { formatAddress, formatEth } from '../../utils/helpers'
import { clsx } from 'clsx'

// Mock data
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, address: '0x1234567890abcdef1234567890abcdef12345678', displayName: 'WordMaster', gamesWon: 147, gamesPlayed: 189, winRate: 0.778, totalEarnings: BigInt(25_000_000_000_000_000_000) },
  { rank: 2, address: '0xabcdef1234567890abcdef1234567890abcdef12', displayName: 'GuesserPro', gamesWon: 132, gamesPlayed: 183, winRate: 0.721, totalEarnings: BigInt(18_500_000_000_000_000_000) },
  { rank: 3, address: '0x7890abcdef1234567890abcdef1234567890abcd', displayName: undefined, gamesWon: 118, gamesPlayed: 170, winRate: 0.694, totalEarnings: BigInt(14_200_000_000_000_000_000) },
  { rank: 4, address: '0xdef1234567890abcdef1234567890abcdef12345', displayName: 'BasedGamer', gamesWon: 105, gamesPlayed: 162, winRate: 0.648, totalEarnings: BigInt(11_800_000_000_000_000_000) },
  { rank: 5, address: '0x4567890abcdef1234567890abcdef1234567890ab', displayName: undefined, gamesWon: 98, gamesPlayed: 158, winRate: 0.620, totalEarnings: BigInt(9_500_000_000_000_000_000) },
  { rank: 6, address: '0x890abcdef1234567890abcdef1234567890abcdef', displayName: 'VocabKing', gamesWon: 89, gamesPlayed: 148, winRate: 0.601, totalEarnings: BigInt(7_800_000_000_000_000_000) },
  { rank: 7, address: '0xcdef1234567890abcdef1234567890abcdef1234', displayName: undefined, gamesWon: 82, gamesPlayed: 140, winRate: 0.586, totalEarnings: BigInt(6_200_000_000_000_000_000) },
  { rank: 8, address: '0x234567890abcdef1234567890abcdef123456789', displayName: 'WordNerd', gamesWon: 76, gamesPlayed: 134, winRate: 0.567, totalEarnings: BigInt(5_100_000_000_000_000_000) },
  { rank: 9, address: '0x567890abcdef1234567890abcdef1234567890abc', displayName: undefined, gamesWon: 71, gamesPlayed: 128, winRate: 0.555, totalEarnings: BigInt(4_300_000_000_000_000_000) },
  { rank: 10, address: '0x90abcdef1234567890abcdef1234567890abcdef1', displayName: 'LetterLord', gamesWon: 67, gamesPlayed: 122, winRate: 0.549, totalEarnings: BigInt(3_700_000_000_000_000_000) },
]

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'allTime', label: 'All Time' },
]

export default function Leaderboard() {
  const { address } = useAccount()
  const [filter, setFilter] = useState<TimeFilter>('allTime')
  const [sortBy, setSortBy] = useState<'wins' | 'earnings'>('wins')

  // In production, fetch data based on filter
  const leaderboard = mockLeaderboard

  // Find user's rank
  const userRank = address
    ? leaderboard.findIndex(
        (e) => e.address.toLowerCase() === address.toLowerCase()
      ) + 1
    : null

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={24} className="text-yellow-500" />
      case 2:
        return <Medal size={24} className="text-gray-400" />
      case 3:
        return <Medal size={24} className="text-amber-700" />
      default:
        return <span className="text-xl text-gray-500 font-bold">{rank}</span>
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">
            Top Word Duel players on Base
          </p>
        </div>

        {/* User Rank Card */}
        {address && userRank && userRank <= 100 && (
          <div className="bg-tile-correct/20 border border-tile-correct rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tile-correct rounded-full flex items-center justify-center">
                  <Trophy size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-tile-correct">Your Rank</p>
                  <p className="text-2xl font-bold text-white">#{userRank}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Top {((userRank / leaderboard.length) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Time Filter */}
          <div className="flex gap-2">
            {timeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === f.value
                    ? 'bg-tile-correct text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('wins')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                sortBy === 'wins'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <TrendingUp size={16} />
              Wins
            </button>
            <button
              onClick={() => setSortBy('earnings')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                sortBy === 'earnings'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Coins size={16} />
              Earnings
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800/50 rounded-xl border border-tile-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-900/50 text-sm font-medium text-gray-400">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">Wins</div>
            <div className="col-span-2 text-center">Games</div>
            <div className="col-span-1 text-center">Win%</div>
            <div className="col-span-2 text-right">Earnings</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-tile-border">
            {leaderboard.map((entry) => {
              const isUser = address?.toLowerCase() === entry.address.toLowerCase()
              
              return (
                <div
                  key={entry.rank}
                  className={clsx(
                    'grid grid-cols-12 gap-4 px-4 py-4 items-center transition-colors',
                    isUser ? 'bg-tile-correct/10' : 'hover:bg-white/5',
                    entry.rank <= 3 && 'bg-gradient-to-r from-transparent to-transparent'
                  )}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Player */}
                  <div className="col-span-4">
                    <p className={clsx('font-medium truncate', isUser ? 'text-tile-correct' : 'text-white')}>
                      {entry.displayName || formatAddress(entry.address)}
                      {isUser && <span className="ml-2 text-xs">(You)</span>}
                    </p>
                  </div>

                  {/* Wins */}
                  <div className="col-span-2 text-center">
                    <span className="text-white font-semibold">{entry.gamesWon}</span>
                  </div>

                  {/* Games */}
                  <div className="col-span-2 text-center text-gray-400">
                    {entry.gamesPlayed}
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-1 text-center">
                    <span
                      className={clsx(
                        'font-semibold',
                        entry.winRate >= 0.7
                          ? 'text-tile-correct'
                          : entry.winRate >= 0.5
                          ? 'text-tile-present'
                          : 'text-gray-400'
                      )}
                    >
                      {(entry.winRate * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Earnings */}
                  <div className="col-span-2 text-right">
                    <span className="text-tile-correct font-semibold">
                      {formatEth(entry.totalEarnings, 2)} ETH
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-6">
          <button className="text-tile-correct hover:underline text-sm">
            Load more...
          </button>
        </div>
      </div>
    </div>
  )
}
