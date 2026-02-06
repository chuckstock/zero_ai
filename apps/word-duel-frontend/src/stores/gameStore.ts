import { create } from 'zustand'
import { GameState, GameBoard, TileState, KeyState, OpponentBoard } from '../types'
import { createEmptyBoard, evaluateGuess, updateKeyboardState } from '../utils/helpers'
import { WORD_LENGTH, MAX_GUESSES } from '../lib/constants'

interface GameStore {
  // Game state
  game: GameState | null
  board: GameBoard
  currentRow: number
  currentGuess: string
  keyboardState: KeyState
  opponentBoard: OpponentBoard | null
  
  // UI state
  isShaking: boolean
  revealingRow: number | null
  timeRemaining: number
  isSubmitting: boolean
  
  // Actions
  setGame: (game: GameState | null) => void
  addLetter: (letter: string) => void
  removeLetter: () => void
  submitGuess: (targetWord: string) => TileState[] | null
  setRevealingRow: (row: number | null) => void
  setTimeRemaining: (time: number) => void
  setOpponentBoard: (board: OpponentBoard) => void
  setShaking: (shaking: boolean) => void
  setSubmitting: (submitting: boolean) => void
  resetGame: () => void
  
  // For WebSocket updates
  applyGuessResult: (row: number, results: TileState[]) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  game: null,
  board: createEmptyBoard(),
  currentRow: 0,
  currentGuess: '',
  keyboardState: {},
  opponentBoard: null,
  isShaking: false,
  revealingRow: null,
  timeRemaining: 30,
  isSubmitting: false,

  setGame: (game) => set({ game }),

  addLetter: (letter) => {
    const { currentGuess, currentRow, board } = get()
    if (currentGuess.length >= WORD_LENGTH) return

    const newGuess = currentGuess + letter
    const newBoard = [...board]
    newBoard[currentRow] = [...newBoard[currentRow]]
    newBoard[currentRow][currentGuess.length] = {
      letter,
      state: 'tbd',
    }

    set({ currentGuess: newGuess, board: newBoard })
  },

  removeLetter: () => {
    const { currentGuess, currentRow, board } = get()
    if (currentGuess.length === 0) return

    const newGuess = currentGuess.slice(0, -1)
    const newBoard = [...board]
    newBoard[currentRow] = [...newBoard[currentRow]]
    newBoard[currentRow][currentGuess.length - 1] = {
      letter: '',
      state: 'empty',
    }

    set({ currentGuess: newGuess, board: newBoard })
  },

  submitGuess: (targetWord) => {
    const { currentGuess, currentRow, board, keyboardState } = get()
    
    if (currentGuess.length !== WORD_LENGTH) return null
    if (currentRow >= MAX_GUESSES) return null

    const results = evaluateGuess(currentGuess, targetWord)
    const newBoard = [...board]
    newBoard[currentRow] = currentGuess.split('').map((letter, i) => ({
      letter,
      state: results[i],
    }))

    const newKeyboardState = updateKeyboardState(keyboardState, currentGuess, results)

    set({
      board: newBoard,
      currentRow: currentRow + 1,
      currentGuess: '',
      keyboardState: newKeyboardState,
      revealingRow: currentRow,
    })

    // Clear revealing state after animation
    setTimeout(() => set({ revealingRow: null }), 500)

    return results
  },

  setRevealingRow: (row) => set({ revealingRow: row }),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  setOpponentBoard: (board) => set({ opponentBoard: board }),

  setShaking: (shaking) => {
    set({ isShaking: shaking })
    if (shaking) {
      setTimeout(() => set({ isShaking: false }), 500)
    }
  },

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  resetGame: () => set({
    game: null,
    board: createEmptyBoard(),
    currentRow: 0,
    currentGuess: '',
    keyboardState: {},
    opponentBoard: null,
    isShaking: false,
    revealingRow: null,
    timeRemaining: 30,
    isSubmitting: false,
  }),

  applyGuessResult: (row, results) => {
    const { board, keyboardState } = get()
    const newBoard = [...board]
    const guess = board[row].map(t => t.letter).join('')
    
    newBoard[row] = guess.split('').map((letter, i) => ({
      letter,
      state: results[i],
    }))

    const newKeyboardState = updateKeyboardState(keyboardState, guess, results)

    set({
      board: newBoard,
      keyboardState: newKeyboardState,
      currentRow: row + 1,
      currentGuess: '',
    })
  },
}))
