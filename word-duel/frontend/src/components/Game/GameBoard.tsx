import { clsx } from 'clsx'
import { GameBoard as GameBoardType, TileState } from '../../types'
import { getTileColor } from '../../utils/helpers'

interface GameBoardProps {
  board: GameBoardType
  currentRow: number
  isShaking?: boolean
  revealingRow?: number | null
}

export default function GameBoard({
  board,
  currentRow,
  isShaking = false,
  revealingRow,
}: GameBoardProps) {
  return (
    <div className="grid gap-1.5">
      {board.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={clsx(
            'flex gap-1.5',
            isShaking && rowIndex === currentRow && 'animate-shake'
          )}
        >
          {row.map((tile, tileIndex) => (
            <Tile
              key={tileIndex}
              letter={tile.letter}
              state={tile.state}
              isRevealing={revealingRow === rowIndex}
              revealDelay={tileIndex * 100}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface TileProps {
  letter: string
  state: TileState
  isRevealing?: boolean
  revealDelay?: number
}

function Tile({ letter, state, isRevealing, revealDelay = 0 }: TileProps) {
  const hasLetter = letter !== ''
  const isEvaluated = state !== 'empty' && state !== 'tbd'

  return (
    <div
      className={clsx(
        'w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase rounded-md transition-all',
        getTileColor(state),
        hasLetter && !isEvaluated && 'animate-pop border-gray-500',
        isRevealing && 'animate-flip',
        isEvaluated && 'text-white'
      )}
      style={{
        animationDelay: isRevealing ? `${revealDelay}ms` : undefined,
      }}
    >
      {letter}
    </div>
  )
}
