import { clsx } from 'clsx'
import { Clock } from 'lucide-react'
import { formatTime } from '../../utils/helpers'

interface TimerProps {
  seconds: number
  isUrgent?: boolean
  isMyTurn?: boolean
}

export default function Timer({ seconds, isUrgent, isMyTurn }: TimerProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold transition-all',
        isMyTurn ? 'bg-tile-correct/20' : 'bg-gray-800/50',
        isUrgent && 'timer-urgent animate-countdown bg-red-500/20'
      )}
    >
      <Clock
        size={20}
        className={clsx(
          isUrgent ? 'text-red-400' : isMyTurn ? 'text-tile-correct' : 'text-gray-400'
        )}
      />
      <span
        className={clsx(
          isUrgent ? 'text-red-400' : isMyTurn ? 'text-tile-correct' : 'text-white'
        )}
      >
        {formatTime(seconds)}
      </span>
      {isMyTurn && (
        <span className="text-xs text-tile-correct ml-2">Your turn</span>
      )}
    </div>
  )
}
