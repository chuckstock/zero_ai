import { keccak256, toHex, encodeAbiParameters, parseAbiParameters, type Hex } from 'viem'
import type { CommitData } from '../types'

/**
 * Generate a random salt for commit-reveal
 */
export function generateSalt(): Hex {
  const bytes = new Uint8Array(32)
  
  // Use crypto.getRandomValues if available (browser + Node 18+)
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    // Fallback for older environments
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  
  return toHex(bytes)
}

/**
 * Convert a 5-letter word to bytes32
 */
export function wordToBytes32(word: string): Hex {
  if (word.length !== 5) {
    throw new Error('Word must be exactly 5 letters')
  }
  
  // Pad to 32 bytes
  const padded = word.toLowerCase().padEnd(32, '\0')
  return toHex(new TextEncoder().encode(padded))
}

/**
 * Convert bytes32 back to word
 */
export function bytes32ToWord(bytes: Hex): string {
  const hex = bytes.slice(2) // Remove 0x prefix
  let word = ''
  
  for (let i = 0; i < 10; i += 2) { // First 5 bytes = 10 hex chars
    const charCode = parseInt(hex.slice(i, i + 2), 16)
    if (charCode === 0) break
    word += String.fromCharCode(charCode)
  }
  
  return word
}

/**
 * Create a commitment hash for commit-reveal scheme
 */
export function createCommitment(guess: string, salt: Hex): Hex {
  const guessBytes = wordToBytes32(guess)
  
  // commitment = keccak256(abi.encodePacked(guess, salt))
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32 guess, bytes32 salt'),
    [guessBytes, salt]
  )
  
  return keccak256(encoded)
}

/**
 * Create full commit data for a guess
 */
export function createCommitData(guess: string): CommitData {
  const salt = generateSalt()
  const commitment = createCommitment(guess, salt)
  
  return {
    guess: guess.toLowerCase(),
    salt,
    commitment
  }
}

/**
 * Verify a commitment matches a guess + salt
 */
export function verifyCommitment(guess: string, salt: Hex, commitment: Hex): boolean {
  const computed = createCommitment(guess, salt)
  return computed.toLowerCase() === commitment.toLowerCase()
}

/**
 * Hash a word for use as target word hash
 */
export function hashWord(word: string, salt?: Hex): Hex {
  const wordBytes = wordToBytes32(word)
  
  if (salt) {
    const encoded = encodeAbiParameters(
      parseAbiParameters('bytes32 word, bytes32 salt'),
      [wordBytes, salt]
    )
    return keccak256(encoded)
  }
  
  return keccak256(wordBytes)
}
