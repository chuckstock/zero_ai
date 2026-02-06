import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Swords, Trophy, TrendingUp, Zap, Users } from 'lucide-react'
import Button from '../shared/Button'
import StatsCard from './StatsCard'
import LeaderboardPreview from './LeaderboardPreview'
import { useUserStore } from '../../stores/userStore'

export default function Home() {
  const { isConnected } = useAccount()
  const { stats } = useUserStore()

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Word<span className="text-tile-correct">Duel</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto">
            PvP word guessing on Base. Stake ETH, solve first, win the pot.
          </p>

          {/* CTA Button */}
          <Link to="/lobby">
            <Button size="lg" icon={<Swords size={24} />} className="gradient-green">
              {isConnected ? 'Find a Match' : 'Play Now'}
            </Button>
          </Link>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mt-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-tile-correct" />
              <span>1,234 players online</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-tile-present" />
              <span>5.2 ETH in games</span>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <HowItWorksCard
              step={1}
              title="Connect & Stake"
              description="Connect your wallet and choose your wager amount"
              color="bg-tile-correct"
            />
            <HowItWorksCard
              step={2}
              title="Match & Guess"
              description="Get matched with an opponent, guess the 5-letter word"
              color="bg-tile-present"
            />
            <HowItWorksCard
              step={3}
              title="Win & Earn"
              description="Solve first to win the pot. Leaderboard glory awaits!"
              color="bg-purple-600"
            />
          </div>
        </section>

        {/* User Stats */}
        {isConnected && stats && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                label="Games Played"
                value={stats.gamesPlayed.toString()}
                icon={<Swords size={20} />}
              />
              <StatsCard
                label="Win Rate"
                value={`${(stats.winRate * 100).toFixed(1)}%`}
                icon={<TrendingUp size={20} />}
                highlight={stats.winRate > 0.5}
              />
              <StatsCard
                label="Current Streak"
                value={stats.currentStreak.toString()}
                icon={<Zap size={20} />}
                highlight={stats.currentStreak >= 3}
              />
              <StatsCard
                label="Total Earnings"
                value={`${(Number(stats.totalEarnings) / 1e18).toFixed(3)} ETH`}
                icon={<Trophy size={20} />}
                highlight
              />
            </div>
          </section>
        )}

        {/* Leaderboard Preview */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Top Players</h2>
            <Link to="/leaderboard" className="text-tile-correct hover:underline">
              View All →
            </Link>
          </div>
          <LeaderboardPreview />
        </section>
      </div>
    </div>
  )
}

interface HowItWorksCardProps {
  step: number
  title: string
  description: string
  color: string
}

function HowItWorksCard({ step, title, description, color }: HowItWorksCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-tile-border hover:border-gray-600 transition-colors">
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-bold mb-4`}>
        {step}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}
