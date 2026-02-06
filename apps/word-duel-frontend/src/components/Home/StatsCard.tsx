import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface StatsCardProps {
  label: string
  value: string
  icon?: ReactNode
  highlight?: boolean
}

export default function StatsCard({ label, value, icon, highlight }: StatsCardProps) {
  return (
    <div
      className={clsx(
        'bg-gray-800/50 rounded-xl p-4 border transition-colors',
        highlight ? 'border-tile-correct' : 'border-tile-border'
      )}
    >
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p
        className={clsx(
          'text-2xl font-bold',
          highlight ? 'text-tile-correct' : 'text-white'
        )}
      >
        {value}
      </p>
    </div>
  )
}
