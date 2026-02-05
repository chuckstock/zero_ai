import { Delete } from 'lucide-react'
import { clsx } from 'clsx'
import { KeyState, TileState } from '../../types'
import { KEYBOARD_ROWS } from '../../lib/constants'
import { getKeyColor } from '../../utils/helpers'

interface KeyboardProps {
  keyboardState: KeyState
  onKeyPress: (key: string) => void
  disabled?: boolean
}

export default function Keyboard({ keyboardState, onKeyPress, disabled }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-lg mx-auto">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map((key) => (
            <Key
              key={key}
              value={key}
              state={keyboardState[key]}
              onClick={() => !disabled && onKeyPress(key)}
              isWide={key === 'ENTER' || key === 'BACKSPACE'}
              disabled={disabled}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface KeyProps {
  value: string
  state?: TileState
  onClick: () => void
  isWide?: boolean
  disabled?: boolean
}

function Key({ value, state, onClick, isWide, disabled }: KeyProps) {
  // const isSpecial = value === 'ENTER' || value === 'BACKSPACE'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center rounded-md font-semibold text-white transition-all active:scale-95',
        isWide ? 'px-3 sm:px-4 min-w-[60px] sm:min-w-[70px]' : 'w-8 sm:w-10',
        'h-12 sm:h-14 text-sm sm:text-base',
        getKeyColor(state),
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:opacity-90'
      )}
    >
      {value === 'BACKSPACE' ? (
        <Delete size={20} />
      ) : value === 'ENTER' ? (
        '↵'
      ) : (
        value
      )}
    </button>
  )
}
