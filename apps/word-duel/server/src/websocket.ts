// WebSocket handler for real-time game updates

import { WebSocket, RawData } from 'ws';
import { 
  WSMessage, 
  GameState,
  JoinGamePayload,
  SetWordPayload,
  CommitGuessPayload,
  RevealGuessPayload,
  MatchmakingPayload,
} from './types';
import * as gameLogic from './game-logic';
import * as db from './db';
import { matchmaking } from './matchmaking';
import { config } from './config';

// In-memory game state (also persisted to DB)
const games = new Map<string, GameState>();

// WebSocket connections by game ID
const gameConnections = new Map<string, Map<string, WebSocket>>();

// Player to game mapping
const playerGames = new Map<string, string>();

// Connection to player mapping
const connectionPlayers = new Map<WebSocket, string>();

/**
 * Load game from memory or DB
 */
function getGame(gameId: string): GameState | null {
  let game = games.get(gameId);
  if (!game) {
    game = db.loadGame(gameId) || null;
    if (game) {
      games.set(gameId, game);
    }
  }
  return game;
}

/**
 * Save game to memory and DB
 */
function saveGame(game: GameState): void {
  games.set(game.id, game);
  db.saveGame(game);
}

/**
 * Send message to a specific client
 */
function sendToClient(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast message to all players in a game
 */
function broadcastToGame(gameId: string, message: WSMessage, excludeAddress?: string): void {
  const connections = gameConnections.get(gameId);
  if (!connections) return;
  
  for (const [address, ws] of connections) {
    if (address !== excludeAddress) {
      sendToClient(ws, message);
    }
  }
}

/**
 * Send game state to all players
 */
function broadcastGameState(game: GameState): void {
  const connections = gameConnections.get(game.id);
  if (!connections) return;
  
  for (const [address, ws] of connections) {
    const publicState = gameLogic.getPublicGameState(game, address);
    sendToClient(ws, { type: 'game_state', payload: publicState });
  }
}

/**
 * Handle player joining a game
 */
function handleJoinGame(ws: WebSocket, payload: JoinGamePayload): void {
  const { gameId, address } = payload;
  const addr = address.toLowerCase();
  
  const game = getGame(gameId);
  if (!game) {
    sendToClient(ws, { type: 'error', payload: { message: 'Game not found' } });
    return;
  }
  
  // Verify player is in this game
  if (game.player1.address !== addr && game.player2?.address !== addr) {
    // Try to join as player 2
    if (game.status === 'waiting') {
      try {
        const updatedGame = gameLogic.joinGame(game, addr);
        saveGame(updatedGame);
        
        // Register connection
        if (!gameConnections.has(gameId)) {
          gameConnections.set(gameId, new Map());
        }
        gameConnections.get(gameId)!.set(addr, ws);
        playerGames.set(addr, gameId);
        connectionPlayers.set(ws, addr);
        
        // Broadcast updated state
        broadcastGameState(updatedGame);
        return;
      } catch (err: any) {
        sendToClient(ws, { type: 'error', payload: { message: err.message } });
        return;
      }
    }
    sendToClient(ws, { type: 'error', payload: { message: 'Not a player in this game' } });
    return;
  }
  
  // Register connection
  if (!gameConnections.has(gameId)) {
    gameConnections.set(gameId, new Map());
  }
  gameConnections.get(gameId)!.set(addr, ws);
  playerGames.set(addr, gameId);
  connectionPlayers.set(ws, addr);
  
  // Send current game state
  const publicState = gameLogic.getPublicGameState(game, addr);
  sendToClient(ws, { type: 'game_state', payload: publicState });
}

/**
 * Handle player setting their secret word
 */
function handleSetWord(ws: WebSocket, payload: SetWordPayload): void {
  const { gameId, address, word, wordHash } = payload;
  const addr = address.toLowerCase();
  
  const game = getGame(gameId);
  if (!game) {
    sendToClient(ws, { type: 'error', payload: { message: 'Game not found' } });
    return;
  }
  
  try {
    const updatedGame = gameLogic.setPlayerWord(game, addr, word, wordHash);
    saveGame(updatedGame);
    
    // Broadcast updated state
    broadcastGameState(updatedGame);
    
    // If game started, broadcast turn_start
    if (updatedGame.status === 'playing' && game.status !== 'playing') {
      broadcastToGame(gameId, {
        type: 'turn_start',
        payload: {
          turn: updatedGame.currentTurn,
          startTime: updatedGame.turnStartTime,
          duration: updatedGame.turnDuration,
        },
      });
      
      // Start turn timer
      startTurnTimer(updatedGame);
    }
  } catch (err: any) {
    sendToClient(ws, { type: 'error', payload: { message: err.message } });
  }
}

/**
 * Handle player committing a guess
 */
function handleCommitGuess(ws: WebSocket, payload: CommitGuessPayload): void {
  const { gameId, address } = payload;
  const addr = address.toLowerCase();
  
  const game = getGame(gameId);
  if (!game) {
    sendToClient(ws, { type: 'error', payload: { message: 'Game not found' } });
    return;
  }
  
  try {
    const updatedGame = gameLogic.commitGuess(game, addr);
    saveGame(updatedGame);
    
    // Broadcast that player committed
    broadcastToGame(gameId, {
      type: 'guess_committed',
      payload: { address: addr },
    });
    
    broadcastGameState(updatedGame);
  } catch (err: any) {
    sendToClient(ws, { type: 'error', payload: { message: err.message } });
  }
}

/**
 * Handle player revealing their guess
 */
function handleRevealGuess(ws: WebSocket, payload: RevealGuessPayload): void {
  const { gameId, address, guess } = payload;
  const addr = address.toLowerCase();
  
  const game = getGame(gameId);
  if (!game) {
    sendToClient(ws, { type: 'error', payload: { message: 'Game not found' } });
    return;
  }
  
  try {
    const updatedGame = gameLogic.revealGuess(game, addr, guess);
    saveGame(updatedGame);
    
    // Get the player who just revealed
    const player = updatedGame.player1.address === addr 
      ? updatedGame.player1 
      : updatedGame.player2!;
    
    const latestGuess = player.guesses[player.guesses.length - 1];
    
    // Broadcast the revealed guess
    broadcastToGame(gameId, {
      type: 'guess_revealed',
      payload: {
        address: addr,
        guess: latestGuess.guess,
        results: latestGuess.results,
        solved: player.solved,
      },
    });
    
    // Check if turn advanced or game ended
    if (updatedGame.status === 'finished') {
      // Update player stats
      db.updatePlayerStats(updatedGame);
      
      broadcastToGame(gameId, {
        type: 'game_end',
        payload: {
          winner: updatedGame.winner,
          player1Word: updatedGame.player1.secretWord,
          player2Word: updatedGame.player2!.secretWord,
        },
      });
    } else if (updatedGame.currentTurn > game.currentTurn) {
      // New turn started
      broadcastToGame(gameId, {
        type: 'turn_start',
        payload: {
          turn: updatedGame.currentTurn,
          startTime: updatedGame.turnStartTime,
          duration: updatedGame.turnDuration,
        },
      });
      
      startTurnTimer(updatedGame);
    }
    
    broadcastGameState(updatedGame);
  } catch (err: any) {
    sendToClient(ws, { type: 'error', payload: { message: err.message } });
  }
}

/**
 * Handle matchmaking join
 */
function handleMatchmakingJoin(ws: WebSocket, payload: MatchmakingPayload): void {
  const { address, stake } = payload;
  const addr = address.toLowerCase();
  
  connectionPlayers.set(ws, addr);
  
  try {
    const opponent = matchmaking.join(addr, stake, (opponentAddress) => {
      // This callback is called when someone else matches with us
      // Create a new game
      const game = gameLogic.createGame(opponentAddress, stake);
      const updatedGame = gameLogic.joinGame(game, addr);
      saveGame(updatedGame);
      
      // Notify this player
      sendToClient(ws, {
        type: 'match_found',
        payload: {
          gameId: updatedGame.id,
          opponent: opponentAddress,
          stake,
        },
      });
    });
    
    if (opponent) {
      // Immediate match found - create game
      const game = gameLogic.createGame(addr, stake);
      const updatedGame = gameLogic.joinGame(game, opponent);
      saveGame(updatedGame);
      
      sendToClient(ws, {
        type: 'match_found',
        payload: {
          gameId: updatedGame.id,
          opponent,
          stake,
        },
      });
    } else {
      // Queued, waiting for opponent
      sendToClient(ws, {
        type: 'matchmaking_join',
        payload: { status: 'queued', stake },
      });
    }
  } catch (err: any) {
    sendToClient(ws, { type: 'error', payload: { message: err.message } });
  }
}

/**
 * Handle matchmaking leave
 */
function handleMatchmakingLeave(ws: WebSocket, payload: MatchmakingPayload): void {
  const { address } = payload;
  const addr = address.toLowerCase();
  
  const removed = matchmaking.leave(addr);
  sendToClient(ws, {
    type: 'matchmaking_leave',
    payload: { success: removed },
  });
}

/**
 * Start turn timer for auto-forfeit
 */
const turnTimers = new Map<string, NodeJS.Timeout>();

function startTurnTimer(game: GameState): void {
  // Clear existing timer
  const existing = turnTimers.get(game.id);
  if (existing) {
    clearTimeout(existing);
  }
  
  // Set new timer
  const timeout = setTimeout(() => {
    const currentGame = getGame(game.id);
    if (!currentGame || currentGame.status !== 'playing') return;
    
    const timedOutGame = gameLogic.handleTimeout(currentGame);
    if (timedOutGame.status === 'finished') {
      saveGame(timedOutGame);
      db.updatePlayerStats(timedOutGame);
      
      broadcastToGame(game.id, {
        type: 'game_end',
        payload: {
          winner: timedOutGame.winner,
          reason: 'timeout',
          player1Word: timedOutGame.player1.secretWord,
          player2Word: timedOutGame.player2!.secretWord,
        },
      });
      
      broadcastGameState(timedOutGame);
    }
    
    turnTimers.delete(game.id);
  }, (game.turnDuration + 5) * 1000); // Add 5 second grace period
  
  turnTimers.set(game.id, timeout);
}

/**
 * Handle WebSocket connection
 */
export function handleConnection(ws: WebSocket): void {
  console.log('New WebSocket connection');
  
  ws.on('message', (data: RawData) => {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;
      
      switch (message.type) {
        case 'join_game':
          handleJoinGame(ws, message.payload);
          break;
        case 'set_word':
          handleSetWord(ws, message.payload);
          break;
        case 'commit_guess':
          handleCommitGuess(ws, message.payload);
          break;
        case 'reveal_guess':
          handleRevealGuess(ws, message.payload);
          break;
        case 'matchmaking_join':
          handleMatchmakingJoin(ws, message.payload);
          break;
        case 'matchmaking_leave':
          handleMatchmakingLeave(ws, message.payload);
          break;
        default:
          sendToClient(ws, { type: 'error', payload: { message: 'Unknown message type' } });
      }
    } catch (err: any) {
      console.error('WebSocket message error:', err);
      sendToClient(ws, { type: 'error', payload: { message: 'Invalid message format' } });
    }
  });
  
  ws.on('close', () => {
    const address = connectionPlayers.get(ws);
    if (address) {
      // Remove from matchmaking if queued
      matchmaking.leave(address);
      
      // Remove from game connections
      const gameId = playerGames.get(address);
      if (gameId) {
        const connections = gameConnections.get(gameId);
        if (connections) {
          connections.delete(address);
          if (connections.size === 0) {
            gameConnections.delete(gameId);
          }
        }
        playerGames.delete(address);
      }
      
      connectionPlayers.delete(ws);
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

/**
 * Create a new game (called from REST API)
 */
export function createNewGame(player1Address: string, stake: string = '0'): GameState {
  const game = gameLogic.createGame(player1Address, stake);
  saveGame(game);
  return game;
}

/**
 * Get a game by ID
 */
export function getGameById(gameId: string): GameState | null {
  return getGame(gameId);
}

/**
 * Get all active games
 */
export function getActiveGames(): GameState[] {
  return db.getActiveGames();
}
