// In-memory matchmaking queue

import { config } from './config';

interface QueueEntry {
  address: string;
  stake: string;
  joinedAt: number;
  callback: (opponentAddress: string) => void;
}

class MatchmakingQueue {
  private queues: Map<string, QueueEntry[]> = new Map(); // stake -> queue
  private playerQueue: Map<string, string> = new Map(); // address -> stake
  
  /**
   * Add a player to the matchmaking queue
   * Returns matched opponent address if found, null if queued
   */
  join(
    address: string,
    stake: string,
    callback: (opponentAddress: string) => void
  ): string | null {
    const addr = address.toLowerCase();
    
    // Check if already in queue
    if (this.playerQueue.has(addr)) {
      throw new Error('Already in matchmaking queue');
    }
    
    // Get or create queue for this stake level
    if (!this.queues.has(stake)) {
      this.queues.set(stake, []);
    }
    const queue = this.queues.get(stake)!;
    
    // Clean up expired entries
    const now = Date.now();
    const validEntries = queue.filter(e => 
      now - e.joinedAt < config.matchmakingTimeout && e.address !== addr
    );
    this.queues.set(stake, validEntries);
    
    // Try to find a match
    if (validEntries.length > 0) {
      const opponent = validEntries.shift()!;
      this.queues.set(stake, validEntries);
      this.playerQueue.delete(opponent.address);
      
      // Notify opponent
      opponent.callback(addr);
      
      return opponent.address;
    }
    
    // No match found, add to queue
    const entry: QueueEntry = {
      address: addr,
      stake,
      joinedAt: now,
      callback,
    };
    validEntries.push(entry);
    this.queues.set(stake, validEntries);
    this.playerQueue.set(addr, stake);
    
    return null;
  }
  
  /**
   * Remove a player from the queue
   */
  leave(address: string): boolean {
    const addr = address.toLowerCase();
    const stake = this.playerQueue.get(addr);
    
    if (!stake) {
      return false;
    }
    
    const queue = this.queues.get(stake);
    if (queue) {
      const filtered = queue.filter(e => e.address !== addr);
      this.queues.set(stake, filtered);
    }
    
    this.playerQueue.delete(addr);
    return true;
  }
  
  /**
   * Check if a player is in queue
   */
  isInQueue(address: string): boolean {
    return this.playerQueue.has(address.toLowerCase());
  }
  
  /**
   * Get queue stats
   */
  getStats(): { totalQueued: number; byStake: Record<string, number> } {
    const byStake: Record<string, number> = {};
    let total = 0;
    
    for (const [stake, queue] of this.queues) {
      byStake[stake] = queue.length;
      total += queue.length;
    }
    
    return { totalQueued: total, byStake };
  }
}

export const matchmaking = new MatchmakingQueue();
