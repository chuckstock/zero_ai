import type { Strategy, StrategyContext } from '../types'
import { OPTIMAL_STARTERS } from '../constants/wordlist'

/**
 * Random strategy - picks randomly from valid candidates
 * Fast but not smart. Good for testing.
 */
export const randomStrategy: Strategy = {
  name: 'random',
  description: 'Picks randomly from valid candidates',
  
  selectGuess(context: StrategyContext): string {
    const { candidates, round, wordUtils } = context
    
    // First guess: use a good starter
    if (round === 1 || candidates.length === 0) {
      const starters = wordUtils.getWordList().length > 0 
        ? OPTIMAL_STARTERS 
        : ['crane', 'slate', 'trace']
      return starters[Math.floor(Math.random() * starters.length)]
    }
    
    // Random from remaining candidates
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
}

/**
 * Frequency strategy - picks words with common letters
 * Faster than information theory, decent results.
 */
export const frequencyStrategy: Strategy = {
  name: 'frequency',
  description: 'Prioritizes words with common English letters',
  
  selectGuess(context: StrategyContext): string {
    const { candidates, round, wordUtils } = context
    
    // First guess: optimal starter
    if (round === 1 || candidates.length === 0) {
      return 'crane' // High frequency letters: C, R, A, N, E
    }
    
    if (candidates.length === 1) {
      return candidates[0]
    }
    
    // Score by letter frequency and pick the best
    let bestWord = candidates[0]
    let bestScore = -Infinity
    
    for (const word of candidates) {
      const score = wordUtils.scoreByFrequency(word)
      if (score > bestScore) {
        bestScore = score
        bestWord = word
      }
    }
    
    return bestWord
  }
}

/**
 * Information Theory strategy - maximizes expected information gain
 * The mathematically optimal approach. Slower but best results.
 */
export const informationTheoryStrategy: Strategy = {
  name: 'informationTheory',
  description: 'Maximizes expected information gain per guess',
  
  selectGuess(context: StrategyContext): string {
    const { candidates, round, wordUtils } = context
    
    // First guess: pre-computed optimal starters
    if (round === 1 || candidates.length === 0) {
      // 'salet' and 'reast' have highest entropy on standard word lists
      return 'salet'
    }
    
    if (candidates.length === 1) {
      return candidates[0]
    }
    
    if (candidates.length === 2) {
      // Just pick one, 50/50
      return candidates[0]
    }
    
    // For small candidate sets, score all candidates
    // For large sets, limit computation
    const guessPool = candidates.length > 500 
      ? candidates.slice(0, 500) 
      : candidates
    
    let bestWord = candidates[0]
    let bestScore = -Infinity
    
    for (const word of guessPool) {
      const score = wordUtils.scoreByInformation(word, candidates)
      // Small bonus for words that could be the answer
      const bonus = candidates.includes(word) ? 0.001 : 0
      
      if (score + bonus > bestScore) {
        bestScore = score + bonus
        bestWord = word
      }
    }
    
    return bestWord
  }
}

/**
 * Adaptive strategy - switches between approaches based on game state
 * Best overall performance.
 */
export const adaptiveStrategy: Strategy = {
  name: 'adaptive',
  description: 'Adapts strategy based on remaining candidates',
  
  selectGuess(context: StrategyContext): string {
    const { candidates, round, wordUtils } = context
    
    // First two guesses: optimal information theory
    if (round <= 2 || candidates.length > 20) {
      return informationTheoryStrategy.selectGuess(context)
    }
    
    // Small candidate pool: just go for it
    if (candidates.length <= 2) {
      return candidates[0]
    }
    
    // Medium pool: balance info gain with solution probability
    // Prefer candidates that could be answers
    let bestWord = candidates[0]
    let bestScore = -Infinity
    
    for (const word of candidates) {
      const infoScore = wordUtils.scoreByInformation(word, candidates)
      const freqScore = wordUtils.scoreByFrequency(word) / 50 // Normalize
      const score = infoScore + freqScore
      
      if (score > bestScore) {
        bestScore = score
        bestWord = word
      }
    }
    
    return bestWord
  }
}

/**
 * Hard Mode strategy - only guesses from remaining candidates
 * Required for strict Wordle rules.
 */
export const hardModeStrategy: Strategy = {
  name: 'hardMode',
  description: 'Only guesses words that match all known feedback',
  
  selectGuess(context: StrategyContext): string {
    const { candidates, round, wordUtils, myGuesses } = context
    
    // First guess
    if (round === 1 || myGuesses.length === 0) {
      return 'salet'
    }
    
    if (candidates.length === 0) {
      // Shouldn't happen, but fallback
      return 'crane'
    }
    
    if (candidates.length <= 2) {
      return candidates[0]
    }
    
    // In hard mode, we must guess from candidates
    // Use information theory within that constraint
    let bestWord = candidates[0]
    let bestScore = -Infinity
    
    for (const word of candidates) {
      const score = wordUtils.scoreByInformation(word, candidates)
      if (score > bestScore) {
        bestScore = score
        bestWord = word
      }
    }
    
    return bestWord
  }
}

// Export all strategies
export const strategies = {
  random: randomStrategy,
  frequency: frequencyStrategy,
  informationTheory: informationTheoryStrategy,
  adaptive: adaptiveStrategy,
  hardMode: hardModeStrategy
}

// Default export
export default strategies
