import { clsx } from 'clsx'

interface CountdownOverlayProps {
  value: number
}

export default function CountdownOverlay({ value }: CountdownOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="text-center">
        <div
          key={value}
          className={clsx(
            'text-9xl font-bold text-white animate-bounce-in',
            value === 0 && 'text-tile-correct'
          )}
        >
          {value === 0 ? 'GO!' : value}
        </div>
        <p className="text-gray-400 mt-4 text-xl">
          {value === 0 ? 'Good luck!' : 'Get ready...'}
        </p>
      </div>
    </div>
  )
}
