/**
 * Word Storage
 * 
 * Stores target words for each round.
 * In production, this could be a database or secure key-value store.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { logger } from './logger';

interface RoundWord {
  roundId: string;
  targetWord: string;
  createdAt: number;
  status: 'active' | 'completed';
}

interface WordStore {
  rounds: Record<string, RoundWord>;
}

const STORE_FILE = 'data/words.json';

export class WordStorage {
  private store: WordStore;

  constructor() {
    this.store = this.load();
    logger.info(`Word store initialized with ${Object.keys(this.store.rounds).length} rounds`);
  }

  private load(): WordStore {
    try {
      if (existsSync(STORE_FILE)) {
        const data = readFileSync(STORE_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.warn('Failed to load word store, creating new one:', error);
    }
    return { rounds: {} };
  }

  private save(): void {
    try {
      // Ensure data directory exists
      const dir = STORE_FILE.split('/').slice(0, -1).join('/');
      if (dir && !existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
      }
      writeFileSync(STORE_FILE, JSON.stringify(this.store, null, 2));
    } catch (error) {
      logger.error('Failed to save word store:', error);
    }
  }

  /**
   * Sets the target word for a round.
   */
  setWord(roundId: bigint, word: string): void {
    const roundKey = roundId.toString();
    const upperWord = word.toUpperCase();

    if (upperWord.length !== 5) {
      throw new Error(`Invalid word length: ${upperWord.length}`);
    }

    this.store.rounds[roundKey] = {
      roundId: roundKey,
      targetWord: upperWord,
      createdAt: Date.now(),
      status: 'active'
    };

    this.save();
    logger.info(`Set target word for round ${roundId}: ${upperWord}`);
  }

  /**
   * Gets the target word for a round.
   */
  getWord(roundId: bigint): string | null {
    const roundKey = roundId.toString();
    const round = this.store.rounds[roundKey];
    return round?.targetWord || null;
  }

  /**
   * Marks a round as completed.
   */
  completeRound(roundId: bigint): void {
    const roundKey = roundId.toString();
    if (this.store.rounds[roundKey]) {
      this.store.rounds[roundKey].status = 'completed';
      this.save();
      logger.info(`Round ${roundId} marked as completed`);
    }
  }

  /**
   * Gets all active rounds.
   */
  getActiveRounds(): RoundWord[] {
    return Object.values(this.store.rounds).filter(r => r.status === 'active');
  }

  /**
   * Checks if a round exists.
   */
  hasRound(roundId: bigint): boolean {
    return this.store.rounds[roundId.toString()] !== undefined;
  }
}

// Singleton instance
let instance: WordStorage | null = null;

export function getWordStorage(): WordStorage {
  if (!instance) {
    instance = new WordStorage();
  }
  return instance;
}
