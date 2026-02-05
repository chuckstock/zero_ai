// Database layer using SQLite

import Database from 'better-sqlite3';
import { config } from '../config';
import { GameState, LeaderboardEntry, PlayerStats, GameSummary } from '../types';
import * as fs from 'fs';
import * as path from 'path';

let db: Database.Database;

export function initDatabase(): void {
  // Ensure data directory exists
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      player1_address TEXT NOT NULL,
      player2_address TEXT,
      player1_word TEXT,
      player2_word TEXT,
      current_turn INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      winner TEXT,
      stake TEXT DEFAULT '0',
      contract_game_id TEXT,
      created_at INTEGER NOT NULL,
      finished_at INTEGER,
      game_data TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_address);
    CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_address);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
    
    CREATE TABLE IF NOT EXISTS player_stats (
      address TEXT PRIMARY KEY,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      total_turns_to_win INTEGER DEFAULT 0,
      total_stake_won TEXT DEFAULT '0',
      updated_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS contract_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      game_id TEXT,
      data TEXT NOT NULL,
      processed_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_block ON contract_events(block_number);
    CREATE INDEX IF NOT EXISTS idx_events_game ON contract_events(game_id);
  `);
  
  console.log('Database initialized');
}

export function saveGame(game: GameState): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO games 
    (id, player1_address, player2_address, player1_word, player2_word, 
     current_turn, status, winner, stake, contract_game_id, created_at, finished_at, game_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    game.id,
    game.player1.address,
    game.player2?.address || null,
    game.player1.secretWord,
    game.player2?.secretWord || null,
    game.currentTurn,
    game.status,
    game.winner,
    game.stake,
    game.contractGameId,
    game.createdAt,
    game.status === 'finished' ? Date.now() : null,
    JSON.stringify(game)
  );
}

export function loadGame(gameId: string): GameState | null {
  const stmt = db.prepare('SELECT game_data FROM games WHERE id = ?');
  const row = stmt.get(gameId) as { game_data: string } | undefined;
  
  if (!row) return null;
  return JSON.parse(row.game_data) as GameState;
}

export function getActiveGames(limit: number = 50): GameState[] {
  const stmt = db.prepare(`
    SELECT game_data FROM games 
    WHERE status IN ('waiting', 'setting_words', 'playing')
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as { game_data: string }[];
  return rows.map(r => JSON.parse(r.game_data));
}

export function getPlayerGames(address: string, limit: number = 20): GameState[] {
  const addr = address.toLowerCase();
  const stmt = db.prepare(`
    SELECT game_data FROM games 
    WHERE player1_address = ? OR player2_address = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(addr, addr, limit) as { game_data: string }[];
  return rows.map(r => JSON.parse(r.game_data));
}

export function updatePlayerStats(game: GameState): void {
  if (game.status !== 'finished' || !game.player2) return;
  
  const now = Date.now();
  const p1 = game.player1.address;
  const p2 = game.player2.address;
  
  // Ensure both players have stats records
  const ensureStats = db.prepare(`
    INSERT OR IGNORE INTO player_stats (address, updated_at)
    VALUES (?, ?)
  `);
  ensureStats.run(p1, now);
  ensureStats.run(p2, now);
  
  if (game.winner === null) {
    // Draw
    const updateDraw = db.prepare(`
      UPDATE player_stats 
      SET draws = draws + 1, updated_at = ?
      WHERE address = ?
    `);
    updateDraw.run(now, p1);
    updateDraw.run(now, p2);
  } else {
    const winner = game.winner;
    const loser = winner === p1 ? p2 : p1;
    const winnerPlayer = winner === p1 ? game.player1 : game.player2;
    const turnsToWin = winnerPlayer.solvedAtTurn || game.currentTurn;
    
    const updateWinner = db.prepare(`
      UPDATE player_stats 
      SET wins = wins + 1, 
          total_turns_to_win = total_turns_to_win + ?,
          total_stake_won = CAST((CAST(total_stake_won AS INTEGER) + CAST(? AS INTEGER)) AS TEXT),
          updated_at = ?
      WHERE address = ?
    `);
    updateWinner.run(turnsToWin, game.stake, now, winner);
    
    const updateLoser = db.prepare(`
      UPDATE player_stats 
      SET losses = losses + 1, updated_at = ?
      WHERE address = ?
    `);
    updateLoser.run(now, loser);
  }
}

export function getLeaderboard(limit: number = 50): LeaderboardEntry[] {
  const stmt = db.prepare(`
    SELECT 
      address,
      wins,
      losses,
      draws,
      total_turns_to_win,
      total_stake_won
    FROM player_stats
    WHERE wins + losses > 0
    ORDER BY wins DESC, (wins * 1.0 / (wins + losses + draws)) DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as {
    address: string;
    wins: number;
    losses: number;
    draws: number;
    total_turns_to_win: number;
    total_stake_won: string;
  }[];
  
  return rows.map(r => ({
    address: r.address,
    wins: r.wins,
    losses: r.losses,
    totalGames: r.wins + r.losses + r.draws,
    winRate: r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0,
    avgTurnsToWin: r.wins > 0 ? r.total_turns_to_win / r.wins : 0,
    totalStakeWon: r.total_stake_won,
  }));
}

export function getPlayerStats(address: string): PlayerStats | null {
  const addr = address.toLowerCase();
  
  const statsStmt = db.prepare(`
    SELECT 
      address,
      wins,
      losses,
      draws,
      total_turns_to_win,
      total_stake_won
    FROM player_stats
    WHERE address = ?
  `);
  
  const stats = statsStmt.get(addr) as {
    address: string;
    wins: number;
    losses: number;
    draws: number;
    total_turns_to_win: number;
    total_stake_won: string;
  } | undefined;
  
  if (!stats) {
    return {
      address: addr,
      wins: 0,
      losses: 0,
      totalGames: 0,
      winRate: 0,
      avgTurnsToWin: 0,
      totalStakeWon: '0',
      recentGames: [],
    };
  }
  
  // Get recent games
  const gamesStmt = db.prepare(`
    SELECT game_data FROM games 
    WHERE (player1_address = ? OR player2_address = ?) AND status = 'finished'
    ORDER BY created_at DESC
    LIMIT 10
  `);
  
  const gameRows = gamesStmt.all(addr, addr) as { game_data: string }[];
  const recentGames: GameSummary[] = gameRows.map(r => {
    const game = JSON.parse(r.game_data) as GameState;
    const isPlayer1 = game.player1.address === addr;
    const opponent = isPlayer1 ? game.player2!.address : game.player1.address;
    
    let result: 'win' | 'loss' | 'draw';
    if (game.winner === null) {
      result = 'draw';
    } else if (game.winner === addr) {
      result = 'win';
    } else {
      result = 'loss';
    }
    
    return {
      id: game.id,
      opponent,
      result,
      turns: game.currentTurn,
      stake: game.stake,
      timestamp: game.createdAt,
    };
  });
  
  return {
    address: addr,
    wins: stats.wins,
    losses: stats.losses,
    totalGames: stats.wins + stats.losses + stats.draws,
    winRate: stats.wins + stats.losses > 0 ? stats.wins / (stats.wins + stats.losses) : 0,
    avgTurnsToWin: stats.wins > 0 ? stats.total_turns_to_win / stats.wins : 0,
    totalStakeWon: stats.total_stake_won,
    recentGames,
  };
}

export function saveContractEvent(
  eventType: string,
  blockNumber: number,
  txHash: string,
  gameId: string | null,
  data: any
): void {
  const stmt = db.prepare(`
    INSERT INTO contract_events (event_type, block_number, tx_hash, game_id, data, processed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(eventType, blockNumber, txHash, gameId, JSON.stringify(data), Date.now());
}

export function getLastProcessedBlock(): number {
  const stmt = db.prepare('SELECT MAX(block_number) as max_block FROM contract_events');
  const row = stmt.get() as { max_block: number | null };
  return row.max_block || 0;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
