/**
 * Word Evaluation Logic (Wordle Rules)
 * 
 * Evaluates a 5-letter guess against a target word.
 * Returns feedback as uint40 (5 bytes packed).
 * 
 * Feedback values per position:
 *   0 = absent (gray)
 *   1 = present but wrong position (yellow)
 *   2 = correct position (green)
 */

import { logger } from './logger';

export type FeedbackValue = 0 | 1 | 2;
export type Feedback = [FeedbackValue, FeedbackValue, FeedbackValue, FeedbackValue, FeedbackValue];

/**
 * Evaluates a guess against the target word using Wordle rules.
 * 
 * Algorithm handles duplicate letters correctly:
 * 1. First pass: Mark exact matches (green/2)
 * 2. Second pass: Mark present letters (yellow/1), respecting remaining counts
 * 
 * @param guess - 5-letter guess (uppercase)
 * @param target - 5-letter target word (uppercase)
 * @returns Feedback array [pos0, pos1, pos2, pos3, pos4]
 */
export function evaluateGuess(guess: string, target: string): Feedback {
  if (guess.length !== 5 || target.length !== 5) {
    throw new Error(`Invalid word length: guess=${guess.length}, target=${target.length}`);
  }

  const guessUpper = guess.toUpperCase();
  const targetUpper = target.toUpperCase();

  const feedback: Feedback = [0, 0, 0, 0, 0];
  const targetLetterCounts: Map<string, number> = new Map();

  // Count letters in target
  for (const char of targetUpper) {
    targetLetterCounts.set(char, (targetLetterCounts.get(char) || 0) + 1);
  }

  // First pass: Mark exact matches (green/2)
  for (let i = 0; i < 5; i++) {
    if (guessUpper[i] === targetUpper[i]) {
      feedback[i] = 2;
      // Decrement available count for this letter
      targetLetterCounts.set(guessUpper[i], targetLetterCounts.get(guessUpper[i])! - 1);
    }
  }

  // Second pass: Mark present letters (yellow/1)
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 2) continue; // Skip already matched

    const char = guessUpper[i];
    const remainingCount = targetLetterCounts.get(char) || 0;

    if (remainingCount > 0) {
      feedback[i] = 1;
      targetLetterCounts.set(char, remainingCount - 1);
    }
    // else feedback[i] stays 0 (absent)
  }

  logger.debug(`Evaluated guess: ${guessUpper} vs ${targetUpper} => [${feedback.join(',')}]`);
  return feedback;
}

/**
 * Packs feedback array into uint40 (5 bytes).
 * Each position gets 1 byte (only uses values 0, 1, 2).
 * 
 * Format: (feedback[0] << 32) | (feedback[1] << 24) | ... | feedback[4]
 * 
 * @param feedback - Array of 5 feedback values
 * @returns BigInt representing uint40
 */
export function packFeedback(feedback: Feedback): bigint {
  let packed = 0n;
  for (let i = 0; i < 5; i++) {
    packed |= BigInt(feedback[i]) << BigInt((4 - i) * 8);
  }
  return packed;
}

/**
 * Unpacks uint40 feedback into array (for debugging/verification).
 */
export function unpackFeedback(packed: bigint): Feedback {
  const feedback: Feedback = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    feedback[i] = Number((packed >> BigInt((4 - i) * 8)) & 0xFFn) as FeedbackValue;
  }
  return feedback;
}

/**
 * Decodes bytes5 guess from contract event into string.
 * bytes5 is right-padded in Solidity but we receive the actual bytes.
 */
export function decodeGuess(guessBytes: string): string {
  // Remove 0x prefix if present
  const hex = guessBytes.startsWith('0x') ? guessBytes.slice(2) : guessBytes;
  
  // Convert hex to ASCII (5 bytes = 10 hex chars)
  let result = '';
  for (let i = 0; i < 10; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (byte === 0) break; // Stop at null byte
    result += String.fromCharCode(byte);
  }
  
  return result.toUpperCase();
}

/**
 * Checks if feedback indicates a winning guess (all correct).
 */
export function isWinningFeedback(feedback: Feedback): boolean {
  return feedback.every(f => f === 2);
}
