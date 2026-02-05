import { clsx } from 'clsx'
import { WAGER_OPTIONS } from '../../lib/constants'

interface WagerSelectorProps {
  selected: string
  onSelect: (wager: string) => void
}

export default function WagerSelector({ selected, onSelect }: WagerSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-400">
        Select Wager Amount
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {WAGER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={clsx(
              'px-4 py-3 rounded-xl font-medium transition-all border-2',
              selected === option.value
                ? 'bg-tile-correct border-tile-correct text-white scale-105'
                : 'bg-gray-800 border-tile-border text-gray-300 hover:border-gray-500'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 text-center">
        Winner takes the pot minus 5% platform fee
      </p>
    </div>
  )
}
