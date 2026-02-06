import { useEffect, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'

interface UseKeyboardOptions {
  disabled?: boolean
  onEnter?: () => void
}

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const { disabled = false, onEnter } = options
  const { addLetter, removeLetter, currentGuess, isSubmitting } = useGameStore()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || isSubmitting) return

    const key = event.key.toUpperCase()

    // Handle Enter
    if (key === 'ENTER') {
      event.preventDefault()
      onEnter?.()
      return
    }

    // Handle Backspace
    if (key === 'BACKSPACE') {
      event.preventDefault()
      removeLetter()
      return
    }

    // Handle letter keys
    if (/^[A-Z]$/.test(key)) {
      event.preventDefault()
      addLetter(key)
    }
  }, [disabled, isSubmitting, onEnter, addLetter, removeLetter])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleVirtualKey = useCallback((key: string) => {
    if (disabled || isSubmitting) return

    if (key === 'ENTER') {
      onEnter?.()
    } else if (key === 'BACKSPACE') {
      removeLetter()
    } else if (/^[A-Z]$/.test(key)) {
      addLetter(key)
    }
  }, [disabled, isSubmitting, onEnter, addLetter, removeLetter])

  return {
    handleVirtualKey,
  }
}
