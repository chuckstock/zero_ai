// Core game types for Word Duel

export type LetterResult = 'green' | 'yellow' | 'gray';

export interface GuessResult {
  guess: string;
  results: LetterResult[];
  timestamp: number;
}

export interface PlayerState {
  address: string;
  secretWord: string | null; // Hidden from opponent
  secretWordHash: string | null;
  guesses: GuessResult[];
  committed: boolean;
  revealed: boolean;
  solved: boolean;
  solvedAtTurn: number | null;
}

export interface GameState {
  id: string;
  player1: PlayerState;
  player2: PlayerState | null;
  currentTurn: number;
  turnStartTime: number | null;
  turnDuration: number; // seconds
  status: 'waiting' | 'setting_words' | 'playing' | 'finished';
  winner: string | null;
  createdAt: number;
  contractGameId: string | null;
  stake: string; // wei amount
}

export interface LeaderboardEntry {
  address: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  avgTurnsToWin: number;
  totalStakeWon: string;
}

export interface PlayerStats {
  address: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  avgTurnsToWin: number;
  totalStakeWon: string;
  recentGames: GameSummary[];
}

export interface GameSummary {
  id: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  turns: number;
  stake: string;
  timestamp: number;
}

// WebSocket message types
export type WSMessageType = 
  | 'join_game'
  | 'set_word'
  | 'commit_guess'
  | 'reveal_guess'
  | 'game_state'
  | 'turn_start'
  | 'guess_committed'
  | 'guess_revealed'
  | 'game_end'
  | 'error'
  | 'matchmaking_join'
  | 'matchmaking_leave'
  | 'match_found';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
}

export interface JoinGamePayload {
  gameId: string;
  address: string;
}

export interface SetWordPayload {
  gameId: string;
  address: string;
  word: string;
  wordHash: string;
}

export interface CommitGuessPayload {
  gameId: string;
  address: string;
  guessHash: string;
}

export interface RevealGuessPayload {
  gameId: string;
  address: string;
  guess: string;
}

export interface MatchmakingPayload {
  address: string;
  stake: string;
}
