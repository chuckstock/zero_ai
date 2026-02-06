import type { Address, Hash, Hex } from 'viem'

// ============================================================================
// Core Game Types
// ============================================================================

export type LetterFeedback = 'correct' | 'present' | 'absent'

export interface GuessFeedback {
  guess: string
  feedback: LetterFeedback[]
}

export type GameStatus = 
  | 'waiting'      // Waiting for opponent
  | 'active'       // Game in progress
  | 'revealing'    // Commit phase done, revealing
  | 'finished'     // Game complete
  | 'expired'      // Timed out
  | 'cancelled'    // Cancelled before start

export interface GameState {
  id: bigint
  player1: Address
  player2: Address | null
  entryFee: bigint
  status: GameStatus
  currentRound: number
  maxRounds: number
  turnDeadline: bigint
  player1Guesses: GuessFeedback[]
  player2Guesses: GuessFeedback[]
  player1Score: number
  player2Score: number
  winner: Address | null
  targetWord?: string // Only known after game ends or if you're host
}

export interface GameFilter {
  maxEntryFee?: string | bigint
  minEntryFee?: string | bigint
  status?: GameStatus
  excludePlayer?: Address
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface WordDuelClientConfig {
  /** RPC URL for the blockchain */
  rpcUrl: string
  /** Private key for signing transactions */
  privateKey: Hex
  /** Word Duel contract address */
  contractAddress: Address
  /** Optional word list (defaults to built-in 5-letter words) */
  wordList?: string[]
  /** Gas price multiplier for faster transactions (default: 1.1) */
  gasPriceMultiplier?: number
  /** Polling interval in ms for game state (default: 3000) */
  pollingInterval?: number
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionResult {
  hash: Hash
  success: boolean
  gasUsed: bigint
  blockNumber: bigint
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  estimatedCost: bigint
}

// ============================================================================
// Commit-Reveal Types
// ============================================================================

export interface CommitData {
  guess: string
  salt: Hex
  commitment: Hex
}

export interface RevealData {
  guess: string
  salt: Hex
}

// ============================================================================
// Strategy Types
// ============================================================================

export interface StrategyContext {
  /** Current game state */
  gameState: GameState
  /** Your previous guesses with feedback */
  myGuesses: GuessFeedback[]
  /** Remaining valid candidates */
  candidates: string[]
  /** Current round number */
  round: number
  /** Word utilities */
  wordUtils: WordUtilsInterface
}

export interface Strategy {
  name: string
  description: string
  /** Select next guess given current context */
  selectGuess(context: StrategyContext): Promise<string> | string
}

// ============================================================================
// Word Utils Interface
// ============================================================================

export interface WordUtilsInterface {
  /** Filter words by feedback from previous guesses */
  filterByFeedback(words: string[], feedback: GuessFeedback[]): string[]
  /** Score word by expected information gain */
  scoreByInformation(word: string, candidates: string[]): number
  /** Score word by letter frequency */
  scoreByFrequency(word: string): number
  /** Get all valid 5-letter words */
  getWordList(): string[]
  /** Check if word is valid */
  isValidWord(word: string): boolean
}

// ============================================================================
// Event Types
// ============================================================================

export type WordDuelEventMap = {
  'gameJoined': (gameState: GameState) => void
  'gameStarted': (gameState: GameState) => void
  'yourTurn': (gameState: GameState) => void
  'opponentTurn': (gameState: GameState) => void
  'guessSubmitted': (guess: string, gameState: GameState) => void
  'roundComplete': (round: number, gameState: GameState) => void
  'gameEnded': (gameState: GameState, won: boolean) => void
  'error': (error: Error) => void
  'stateUpdate': (gameState: GameState) => void
}

export type WordDuelEvent = keyof WordDuelEventMap
