// Tile state after a guess
export type TileState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent'

// Single tile in the game grid
export interface Tile {
  letter: string
  state: TileState
}

// A row of 5 tiles (one guess)
export type GameRow = Tile[]

// Full game board (6 rows x 5 tiles)
export type GameBoard = GameRow[]

// Player in a game
export interface Player {
  address: string
  displayName?: string
  avatar?: string
  currentRow: number
  board: GameBoard
  hasWon: boolean
  hasLost: boolean
}

// Game state
export type GameStatus = 'waiting' | 'countdown' | 'active' | 'finished'

// Full game object
export interface GameState {
  id: string
  status: GameStatus
  players: [Player, Player] | [Player]
  currentTurn: string // address of player whose turn it is
  turnStartTime: number
  turnDuration: number // seconds
  wager: bigint
  totalPot: bigint
  winner?: string
  word?: string // revealed at end
  createdAt: number
}

// Lobby/matchmaking
export interface LobbyGame {
  id: string
  creator: string
  creatorName?: string
  wager: bigint
  createdAt: number
  status: 'open' | 'starting'
}

// User stats
export interface UserStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  totalEarnings: bigint
  totalWagered: bigint
  averageGuesses: number
  winRate: number
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number
  address: string
  displayName?: string
  gamesWon: number
  gamesPlayed: number
  winRate: number
  totalEarnings: bigint
}

// WebSocket message types
export type WSMessageType =
  | 'join_queue'
  | 'leave_queue'
  | 'create_game'
  | 'join_game'
  | 'submit_guess'
  | 'game_update'
  | 'game_start'
  | 'game_end'
  | 'turn_update'
  | 'opponent_progress'
  | 'error'
  | 'queue_update'
  | 'ping'
  | 'pong'

// WebSocket message
export interface WSMessage {
  type: WSMessageType
  payload: unknown
  timestamp: number
}

// Opponent board (only shows colors, not letters)
export interface OpponentBoard {
  rows: TileState[][]
  currentRow: number
}

// Keyboard key state
export interface KeyState {
  [key: string]: TileState
}

// Time filter for leaderboard
export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'allTime'

// Toast notification
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}
