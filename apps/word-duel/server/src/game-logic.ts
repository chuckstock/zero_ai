// Core game logic for Word Duel

import { LetterResult, GuessResult, GameState, PlayerState } from './types';
import { isValidWord } from './words';
import { config } from './config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Compute letter colors for a guess against a secret word
 * Green = correct position, Yellow = wrong position, Gray = not in word
 */
export function computeGuessResult(guess: string, secretWord: string): LetterResult[] {
  const guessLower = guess.toLowerCase();
  const secretLower = secretWord.toLowerCase();
  const results: LetterResult[] = new Array(5).fill('gray');
  const secretLetterCounts: Map<string, number> = new Map();
  
  // Count letters in secret word
  for (const letter of secretLower) {
    secretLetterCounts.set(letter, (secretLetterCounts.get(letter) || 0) + 1);
  }
  
  // First pass: mark greens and decrement counts
  for (let i = 0; i < 5; i++) {
    if (guessLower[i] === secretLower[i]) {
      results[i] = 'green';
      secretLetterCounts.set(guessLower[i], secretLetterCounts.get(guessLower[i])! - 1);
    }
  }
  
  // Second pass: mark yellows for remaining letters
  for (let i = 0; i < 5; i++) {
    if (results[i] !== 'green') {
      const count = secretLetterCounts.get(guessLower[i]) || 0;
      if (count > 0) {
        results[i] = 'yellow';
        secretLetterCounts.set(guessLower[i], count - 1);
      }
    }
  }
  
  return results;
}

/**
 * Check if a guess solves the word
 */
export function isSolved(guess: string, secretWord: string): boolean {
  return guess.toLowerCase() === secretWord.toLowerCase();
}

/**
 * Create a new player state
 */
export function createPlayerState(address: string): PlayerState {
  return {
    address: address.toLowerCase(),
    secretWord: null,
    secretWordHash: null,
    guesses: [],
    committed: false,
    revealed: false,
    solved: false,
    solvedAtTurn: null,
  };
}

/**
 * Create a new game
 */
export function createGame(player1Address: string, stake: string = '0'): GameState {
  return {
    id: uuidv4(),
    player1: createPlayerState(player1Address),
    player2: null,
    currentTurn: 0,
    turnStartTime: null,
    turnDuration: config.turnDuration,
    status: 'waiting',
    winner: null,
    createdAt: Date.now(),
    contractGameId: null,
    stake,
  };
}

/**
 * Join a game as player 2
 */
export function joinGame(game: GameState, player2Address: string): GameState {
  if (game.status !== 'waiting') {
    throw new Error('Game is not waiting for players');
  }
  if (game.player1.address === player2Address.toLowerCase()) {
    throw new Error('Cannot play against yourself');
  }
  
  return {
    ...game,
    player2: createPlayerState(player2Address),
    status: 'setting_words',
  };
}

/**
 * Set a player's secret word
 */
export function setPlayerWord(
  game: GameState,
  playerAddress: string,
  word: string,
  wordHash: string
): GameState {
  if (game.status !== 'setting_words') {
    throw new Error('Not in word setting phase');
  }
  
  const normalizedWord = word.toLowerCase();
  if (normalizedWord.length !== 5) {
    throw new Error('Word must be 5 letters');
  }
  if (!isValidWord(normalizedWord)) {
    throw new Error('Invalid word');
  }
  
  const addr = playerAddress.toLowerCase();
  let updatedGame = { ...game };
  
  if (game.player1.address === addr) {
    updatedGame.player1 = {
      ...game.player1,
      secretWord: normalizedWord,
      secretWordHash: wordHash,
    };
  } else if (game.player2?.address === addr) {
    updatedGame.player2 = {
      ...game.player2,
      secretWord: normalizedWord,
      secretWordHash: wordHash,
    };
  } else {
    throw new Error('Player not in game');
  }
  
  // Check if both players have set words -> start game
  if (updatedGame.player1.secretWord && updatedGame.player2?.secretWord) {
    updatedGame.status = 'playing';
    updatedGame.currentTurn = 1;
    updatedGame.turnStartTime = Date.now();
  }
  
  return updatedGame;
}

/**
 * Commit a guess (just marks as committed, doesn't reveal)
 */
export function commitGuess(game: GameState, playerAddress: string): GameState {
  if (game.status !== 'playing') {
    throw new Error('Game not in progress');
  }
  
  const addr = playerAddress.toLowerCase();
  let updatedGame = { ...game };
  
  if (game.player1.address === addr) {
    if (game.player1.committed) {
      throw new Error('Already committed this turn');
    }
    updatedGame.player1 = { ...game.player1, committed: true };
  } else if (game.player2?.address === addr) {
    if (game.player2.committed) {
      throw new Error('Already committed this turn');
    }
    updatedGame.player2 = { ...game.player2, committed: true };
  } else {
    throw new Error('Player not in game');
  }
  
  return updatedGame;
}

/**
 * Reveal a guess and compute results
 */
export function revealGuess(
  game: GameState,
  playerAddress: string,
  guess: string
): GameState {
  if (game.status !== 'playing') {
    throw new Error('Game not in progress');
  }
  
  const normalizedGuess = guess.toLowerCase();
  if (normalizedGuess.length !== 5) {
    throw new Error('Guess must be 5 letters');
  }
  if (!isValidWord(normalizedGuess)) {
    throw new Error('Invalid word');
  }
  
  const addr = playerAddress.toLowerCase();
  let updatedGame = { ...game };
  
  // Determine which player is guessing and which word they're guessing
  let guessingPlayer: PlayerState;
  let opponentWord: string;
  let isPlayer1: boolean;
  
  if (game.player1.address === addr) {
    guessingPlayer = game.player1;
    opponentWord = game.player2!.secretWord!;
    isPlayer1 = true;
  } else if (game.player2?.address === addr) {
    guessingPlayer = game.player2;
    opponentWord = game.player1.secretWord!;
    isPlayer1 = false;
  } else {
    throw new Error('Player not in game');
  }
  
  if (!guessingPlayer.committed) {
    throw new Error('Must commit before revealing');
  }
  if (guessingPlayer.revealed) {
    throw new Error('Already revealed this turn');
  }
  
  // Compute guess result
  const results = computeGuessResult(normalizedGuess, opponentWord);
  const guessResult: GuessResult = {
    guess: normalizedGuess,
    results,
    timestamp: Date.now(),
  };
  
  const solved = isSolved(normalizedGuess, opponentWord);
  
  const updatedPlayer: PlayerState = {
    ...guessingPlayer,
    guesses: [...guessingPlayer.guesses, guessResult],
    revealed: true,
    solved: solved || guessingPlayer.solved,
    solvedAtTurn: solved && !guessingPlayer.solved ? game.currentTurn : guessingPlayer.solvedAtTurn,
  };
  
  if (isPlayer1) {
    updatedGame.player1 = updatedPlayer;
  } else {
    updatedGame.player2 = updatedPlayer;
  }
  
  // Check if both players have revealed -> advance turn or end game
  if (updatedGame.player1.revealed && updatedGame.player2?.revealed) {
    updatedGame = advanceTurn(updatedGame);
  }
  
  return updatedGame;
}

/**
 * Advance to next turn or end game
 */
function advanceTurn(game: GameState): GameState {
  const p1Solved = game.player1.solved;
  const p2Solved = game.player2!.solved;
  const maxTurns = config.maxTurns;
  
  // Determine winner
  if (p1Solved && p2Solved) {
    // Both solved - winner is whoever solved in fewer turns
    const p1Turns = game.player1.solvedAtTurn!;
    const p2Turns = game.player2!.solvedAtTurn!;
    
    if (p1Turns < p2Turns) {
      return endGame(game, game.player1.address);
    } else if (p2Turns < p1Turns) {
      return endGame(game, game.player2!.address);
    } else {
      // Tie - no winner
      return endGame(game, null);
    }
  }
  
  if (p1Solved && !p2Solved) {
    // P1 wins if we've reached max turns
    if (game.currentTurn >= maxTurns) {
      return endGame(game, game.player1.address);
    }
  }
  
  if (p2Solved && !p1Solved) {
    // P2 wins if we've reached max turns
    if (game.currentTurn >= maxTurns) {
      return endGame(game, game.player2!.address);
    }
  }
  
  // Max turns reached without solution - neither wins
  if (game.currentTurn >= maxTurns) {
    return endGame(game, null);
  }
  
  // Continue to next turn
  return {
    ...game,
    currentTurn: game.currentTurn + 1,
    turnStartTime: Date.now(),
    player1: { ...game.player1, committed: false, revealed: false },
    player2: { ...game.player2!, committed: false, revealed: false },
  };
}

/**
 * End the game
 */
function endGame(game: GameState, winner: string | null): GameState {
  return {
    ...game,
    status: 'finished',
    winner,
  };
}

/**
 * Handle timeout - forfeit for player who didn't commit/reveal
 */
export function handleTimeout(game: GameState): GameState {
  if (game.status !== 'playing') {
    return game;
  }
  
  if (!game.turnStartTime) {
    return game;
  }
  
  const elapsed = Date.now() - game.turnStartTime;
  if (elapsed < game.turnDuration * 1000) {
    return game; // Not timed out yet
  }
  
  const p1Done = game.player1.committed && game.player1.revealed;
  const p2Done = game.player2!.committed && game.player2!.revealed;
  
  if (!p1Done && !p2Done) {
    // Both timed out - draw
    return endGame(game, null);
  }
  
  if (!p1Done) {
    // P1 forfeits
    return endGame(game, game.player2!.address);
  }
  
  if (!p2Done) {
    // P2 forfeits
    return endGame(game, game.player1.address);
  }
  
  return game;
}

/**
 * Get public game state (hides secret words from opponents)
 */
export function getPublicGameState(game: GameState, forAddress: string | null = null): any {
  const addr = forAddress?.toLowerCase();
  
  const hideSecretWord = (player: PlayerState, isOwner: boolean): any => ({
    address: player.address,
    secretWordSet: !!player.secretWord,
    secretWord: isOwner && game.status === 'finished' ? player.secretWord : undefined,
    guesses: player.guesses,
    committed: player.committed,
    revealed: player.revealed,
    solved: player.solved,
    solvedAtTurn: player.solvedAtTurn,
  });
  
  return {
    id: game.id,
    player1: hideSecretWord(game.player1, addr === game.player1.address),
    player2: game.player2 
      ? hideSecretWord(game.player2, addr === game.player2.address) 
      : null,
    currentTurn: game.currentTurn,
    turnStartTime: game.turnStartTime,
    turnDuration: game.turnDuration,
    status: game.status,
    winner: game.winner,
    createdAt: game.createdAt,
    contractGameId: game.contractGameId,
    stake: game.stake,
  };
}
