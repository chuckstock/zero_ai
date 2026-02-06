import { TileState, GameBoard, KeyState } from '../types'
import { WORD_LENGTH, MAX_GUESSES } from '../lib/constants'

/**
 * Create an empty game board
 */
export function createEmptyBoard(): GameBoard {
  return Array(MAX_GUESSES).fill(null).map(() =>
    Array(WORD_LENGTH).fill(null).map(() => ({
      letter: '',
      state: 'empty' as TileState,
    }))
  )
}

/**
 * Evaluate a guess against the target word
 */
export function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(WORD_LENGTH).fill('absent')
  const targetLetters = target.split('')
  const guessLetters = guess.split('')
  
  // First pass: mark correct letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct'
      targetLetters[i] = '' // Mark as used
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    
    const targetIndex = targetLetters.indexOf(guessLetters[i])
    if (targetIndex !== -1) {
      result[i] = 'present'
      targetLetters[targetIndex] = '' // Mark as used
    }
  }
  
  return result
}

/**
 * Update keyboard state based on guess results
 */
export function updateKeyboardState(
  currentState: KeyState,
  guess: string,
  results: TileState[]
): KeyState {
  const newState = { ...currentState }
  
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i]
    const result = results[i]
    const currentLetterState = newState[letter]
    
    // Only upgrade the state (correct > present > absent)
    if (result === 'correct') {
      newState[letter] = 'correct'
    } else if (result === 'present' && currentLetterState !== 'correct') {
      newState[letter] = 'present'
    } else if (result === 'absent' && !currentLetterState) {
      newState[letter] = 'absent'
    }
  }
  
  return newState
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format ETH amount
 */
export function formatEth(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18
  return eth.toFixed(decimals)
}

/**
 * Parse ETH string to wei
 */
export function parseEthToWei(eth: string): bigint {
  const num = parseFloat(eth)
  return BigInt(Math.floor(num * 1e18))
}

/**
 * Format time remaining
 */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Generate a share text for results
 */
export function generateShareText(
  gameId: string,
  won: boolean,
  guesses: number,
  maxGuesses: number
): string {
  const result = won ? `${guesses}/${maxGuesses}` : 'X/6'
  return `Word Duel ${result} 🎮\n\nPlay: ${window.location.origin}/game/${gameId}`
}

/**
 * Get tile background color class
 */
export function getTileColor(state: TileState): string {
  switch (state) {
    case 'correct':
      return 'bg-tile-correct'
    case 'present':
      return 'bg-tile-present'
    case 'absent':
      return 'bg-tile-absent'
    case 'tbd':
      return 'bg-tile-empty border-2 border-gray-500'
    default:
      return 'bg-tile-empty border-2 border-tile-border'
  }
}

/**
 * Get keyboard key background color class
 */
export function getKeyColor(state: TileState | undefined): string {
  switch (state) {
    case 'correct':
      return 'bg-tile-correct'
    case 'present':
      return 'bg-tile-present'
    case 'absent':
      return 'bg-tile-absent'
    default:
      return 'bg-key-default'
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Play a sound effect
 */
export function playSound(soundUrl: string, volume = 0.5): void {
  try {
    const audio = new Audio(soundUrl)
    audio.volume = volume
    audio.play().catch(() => {
      // Ignore errors (e.g., user hasn't interacted yet)
    })
  } catch {
    // Ignore errors
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
