import { SOLUTION_WORDS, ALL_WORDS, LETTER_FREQUENCY, OPTIMAL_STARTERS } from '../constants/wordlist'
import type { GuessFeedback, LetterFeedback, WordUtilsInterface } from '../types'

/**
 * Word utilities for filtering candidates and scoring guesses
 */
export class WordUtils implements WordUtilsInterface {
  private wordSet: Set<string>
  private wordList: string[]

  constructor(customWordList?: string[]) {
    this.wordList = customWordList || [...SOLUTION_WORDS]
    this.wordSet = new Set(customWordList || ALL_WORDS)
  }

  /**
   * Get the word list
   */
  getWordList(): string[] {
    return [...this.wordList]
  }

  /**
   * Check if a word is valid
   */
  isValidWord(word: string): boolean {
    return this.wordSet.has(word.toLowerCase())
  }

  /**
   * Filter words by accumulated feedback from previous guesses
   */
  filterByFeedback(words: string[], feedbackHistory: GuessFeedback[]): string[] {
    return words.filter(word => this.matchesFeedback(word, feedbackHistory))
  }

  /**
   * Check if a word matches all feedback constraints
   */
  matchesFeedback(word: string, feedbackHistory: GuessFeedback[]): boolean {
    const w = word.toLowerCase()
    
    for (const { guess, feedback } of feedbackHistory) {
      const g = guess.toLowerCase()
      
      // Track letter counts in target word
      const letterCounts = new Map<string, number>()
      for (const letter of w) {
        letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1)
      }
      
      // First pass: handle 'correct' positions (reduce available counts)
      for (let i = 0; i < 5; i++) {
        if (feedback[i] === 'correct') {
          if (w[i] !== g[i]) return false
          letterCounts.set(g[i], (letterCounts.get(g[i]) || 0) - 1)
        }
      }
      
      // Second pass: handle 'present' and 'absent'
      for (let i = 0; i < 5; i++) {
        const letter = g[i]
        
        if (feedback[i] === 'present') {
          // Letter must be in word but NOT at this position
          if (w[i] === letter) return false
          const remaining = letterCounts.get(letter) || 0
          if (remaining <= 0) return false
          letterCounts.set(letter, remaining - 1)
        } else if (feedback[i] === 'absent') {
          // Letter should not appear (beyond what's accounted for)
          const remaining = letterCounts.get(letter) || 0
          if (remaining > 0) return false
        }
      }
    }
    
    return true
  }

  /**
   * Score a word by expected information gain
   * Higher score = better guess for eliminating candidates
   */
  scoreByInformation(guess: string, candidates: string[]): number {
    if (candidates.length <= 1) return 0
    
    // Count how many candidates produce each feedback pattern
    const patternCounts = new Map<string, number>()
    
    for (const target of candidates) {
      const pattern = this.getFeedbackPattern(guess, target)
      const key = pattern.join('')
      patternCounts.set(key, (patternCounts.get(key) || 0) + 1)
    }
    
    // Calculate entropy (expected information gain)
    let entropy = 0
    const total = candidates.length
    
    for (const count of patternCounts.values()) {
      const probability = count / total
      entropy -= probability * Math.log2(probability)
    }
    
    return entropy
  }

  /**
   * Get the feedback pattern for a guess against a target
   */
  getFeedbackPattern(guess: string, target: string): LetterFeedback[] {
    const g = guess.toLowerCase()
    const t = target.toLowerCase()
    const feedback: LetterFeedback[] = new Array(5).fill('absent')
    
    // Track available letters in target
    const available = new Map<string, number>()
    for (const letter of t) {
      available.set(letter, (available.get(letter) || 0) + 1)
    }
    
    // First pass: mark correct positions
    for (let i = 0; i < 5; i++) {
      if (g[i] === t[i]) {
        feedback[i] = 'correct'
        available.set(g[i], (available.get(g[i]) || 0) - 1)
      }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
      if (feedback[i] !== 'correct') {
        const remaining = available.get(g[i]) || 0
        if (remaining > 0) {
          feedback[i] = 'present'
          available.set(g[i], remaining - 1)
        }
      }
    }
    
    return feedback
  }

  /**
   * Score a word by letter frequency (higher = more common letters)
   */
  scoreByFrequency(word: string): number {
    const seen = new Set<string>()
    let score = 0
    
    for (const letter of word.toLowerCase()) {
      // Only count unique letters (avoid double-letter penalties)
      if (!seen.has(letter)) {
        seen.add(letter)
        score += LETTER_FREQUENCY[letter] || 0
      }
    }
    
    return score
  }

  /**
   * Score by positional frequency (letter likelihood at each position)
   */
  scoreByPositionalFrequency(word: string, candidates: string[]): number {
    // Build positional frequency from candidates
    const posFreq: Map<string, number>[] = Array(5).fill(null).map(() => new Map())
    
    for (const candidate of candidates) {
      for (let i = 0; i < 5; i++) {
        const letter = candidate[i]
        posFreq[i].set(letter, (posFreq[i].get(letter) || 0) + 1)
      }
    }
    
    // Score the word
    let score = 0
    const seen = new Set<string>()
    const total = candidates.length
    
    for (let i = 0; i < 5; i++) {
      const letter = word[i]
      if (!seen.has(letter)) {
        seen.add(letter)
        score += (posFreq[i].get(letter) || 0) / total
      }
    }
    
    return score
  }

  /**
   * Get ranked candidates by a scoring function
   */
  rankCandidates(
    candidates: string[],
    scoreFn: (word: string) => number,
    limit = 10
  ): Array<{ word: string; score: number }> {
    return candidates
      .map(word => ({ word, score: scoreFn(word) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Get the best starting words
   */
  getOptimalStarters(): string[] {
    return [...OPTIMAL_STARTERS]
  }

  /**
   * Suggest the best next guess
   */
  suggestGuess(
    candidates: string[],
    method: 'information' | 'frequency' | 'positional' = 'information'
  ): string {
    if (candidates.length === 0) {
      return OPTIMAL_STARTERS[0]
    }
    
    if (candidates.length === 1) {
      return candidates[0]
    }
    
    // For first guess or many candidates, use full word list for guessing
    const guessPool = candidates.length > 100 ? this.wordList : candidates
    
    let bestWord = candidates[0]
    let bestScore = -Infinity
    
    for (const word of guessPool) {
      let score: number
      
      switch (method) {
        case 'information':
          score = this.scoreByInformation(word, candidates)
          // Slight bonus if word is a possible answer
          if (candidates.includes(word)) score += 0.01
          break
        case 'frequency':
          score = this.scoreByFrequency(word)
          break
        case 'positional':
          score = this.scoreByPositionalFrequency(word, candidates)
          break
      }
      
      if (score > bestScore) {
        bestScore = score
        bestWord = word
      }
    }
    
    return bestWord
  }
}

// Export singleton for convenience
export const wordUtils = new WordUtils()
