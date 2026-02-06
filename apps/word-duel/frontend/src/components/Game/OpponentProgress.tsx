import { clsx } from 'clsx'
import { OpponentBoard, TileState } from '../../types'
import { getTileColor } from '../../utils/helpers'
import { MAX_GUESSES, WORD_LENGTH } from '../../lib/constants'

interface OpponentProgressProps {
  board: OpponentBoard
}

export default function OpponentProgress({ board }: OpponentProgressProps) {
  // Create a full 6x5 grid for display
  const displayRows = Array(MAX_GUESSES).fill(null).map((_, rowIndex) => {
    if (rowIndex < board.rows.length) {
      return board.rows[rowIndex]
    }
    return Array(WORD_LENGTH).fill('empty' as TileState)
  })

  return (
    <div className="grid gap-1">
      {displayRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((state, tileIndex) => (
            <div
              key={tileIndex}
              className={clsx(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-sm transition-all',
                getTileColor(state),
                rowIndex === board.currentRow && state === 'empty' && 'opacity-50'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Mini progress indicator for header
export function OpponentProgressMini({ board }: OpponentProgressProps) {
  return (
    <div className="flex gap-0.5">
      {Array(MAX_GUESSES).fill(null).map((_, rowIndex) => {
        const hasRow = rowIndex < board.rows.length
        const hasCorrect = hasRow && board.rows[rowIndex].some(s => s === 'correct')
        
        return (
          <div
            key={rowIndex}
            className={clsx(
              'w-2 h-2 rounded-full',
              hasRow ? (hasCorrect ? 'bg-tile-correct' : 'bg-tile-present') : 'bg-gray-600'
            )}
          />
        )
      })}
    </div>
  )
}
