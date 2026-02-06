import { useEffect, useState } from 'react'
import { Loader2, X, Users } from 'lucide-react'
import Button from '../shared/Button'
import { useLobbyStore } from '../../stores/lobbyStore'

interface MatchmakingQueueProps {
  wager: string
  onCancel: () => void
}

export default function MatchmakingQueue({ wager, onCancel }: MatchmakingQueueProps) {
  const { queuePosition, queueSize } = useLobbyStore()
  const [searchTime, setSearchTime] = useState(0)
  const [dots, setDots] = useState('')

  // Update search time
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchTime((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
      {/* Animated Icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-tile-correct/20 rounded-full animate-ping" />
        <div className="relative w-full h-full bg-tile-correct rounded-full flex items-center justify-center">
          <Loader2 size={40} className="text-white animate-spin" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Finding Opponent{dots}
      </h2>

      <p className="text-gray-400 mb-6">
        Matching you with a player at {wager} ETH
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/50 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Search Time</p>
          <p className="text-2xl font-bold text-white">{formatSearchTime(searchTime)}</p>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Players in Queue</p>
          <div className="flex items-center justify-center gap-2">
            <Users size={20} className="text-tile-correct" />
            <p className="text-2xl font-bold text-white">{queueSize || '...'}</p>
          </div>
        </div>
      </div>

      {/* Queue Position */}
      {queuePosition > 0 && (
        <p className="text-sm text-gray-500 mb-6">
          Your position in queue: #{queuePosition}
        </p>
      )}

      {/* Cancel Button */}
      <Button
        variant="ghost"
        onClick={onCancel}
        icon={<X size={18} />}
        fullWidth
      >
        Cancel
      </Button>

      {/* Tips */}
      <p className="text-xs text-gray-600 mt-6">
        Tip: Higher wagers often have faster matches
      </p>
    </div>
  )
}
