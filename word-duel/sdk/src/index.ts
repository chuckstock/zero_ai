// Main client
export { WordDuelClient } from './client/WordDuelClient'

// Strategies
export { 
  strategies,
  randomStrategy,
  frequencyStrategy,
  informationTheoryStrategy,
  adaptiveStrategy,
  hardModeStrategy
} from './strategies'

// Word utilities
export { WordUtils, wordUtils } from './utils/wordUtils'

// Crypto utilities
export {
  generateSalt,
  wordToBytes32,
  bytes32ToWord,
  createCommitment,
  createCommitData,
  verifyCommitment,
  hashWord
} from './utils/crypto'

// Constants
export { WORD_DUEL_ABI } from './constants/abi'
export { 
  SOLUTION_WORDS, 
  EXTENDED_WORDS, 
  ALL_WORDS,
  LETTER_FREQUENCY,
  OPTIMAL_STARTERS
} from './constants/wordlist'

// Types
export type {
  LetterFeedback,
  GuessFeedback,
  GameStatus,
  GameState,
  GameFilter,
  WordDuelClientConfig,
  TransactionResult,
  GasEstimate,
  CommitData,
  RevealData,
  Strategy,
  StrategyContext,
  WordUtilsInterface,
  WordDuelEventMap,
  WordDuelEvent
} from './types'
