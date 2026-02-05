// REST API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as db from './db';
import * as ws from './websocket';
import { getPublicGameState } from './game-logic';
import { matchmaking } from './matchmaking';

interface CreateGameBody {
  address: string;
  stake?: string;
}

interface GameParams {
  id: string;
}

interface PlayerParams {
  address: string;
}

interface LeaderboardQuery {
  limit?: number;
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  
  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });
  
  // Get active games
  app.get('/games', async (request: FastifyRequest<{ Querystring: LeaderboardQuery }>, reply: FastifyReply) => {
    const limit = request.query.limit || 50;
    const games = ws.getActiveGames();
    
    return {
      games: games.map(g => getPublicGameState(g)),
      count: games.length,
    };
  });
  
  // Create a new game
  app.post('/games', async (request: FastifyRequest<{ Body: CreateGameBody }>, reply: FastifyReply) => {
    const { address, stake = '0' } = request.body;
    
    if (!address) {
      return reply.status(400).send({ error: 'Address is required' });
    }
    
    const game = ws.createNewGame(address, stake);
    
    return {
      gameId: game.id,
      ...getPublicGameState(game),
    };
  });
  
  // Get game details
  app.get('/games/:id', async (request: FastifyRequest<{ Params: GameParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const game = ws.getGameById(id);
    if (!game) {
      return reply.status(404).send({ error: 'Game not found' });
    }
    
    return getPublicGameState(game);
  });
  
  // Get leaderboard
  app.get('/leaderboard', async (request: FastifyRequest<{ Querystring: LeaderboardQuery }>, reply: FastifyReply) => {
    const limit = request.query.limit || 50;
    const leaderboard = db.getLeaderboard(limit);
    
    return {
      leaderboard,
      count: leaderboard.length,
    };
  });
  
  // Get player stats
  app.get('/players/:address', async (request: FastifyRequest<{ Params: PlayerParams }>, reply: FastifyReply) => {
    const { address } = request.params;
    
    const stats = db.getPlayerStats(address);
    if (!stats) {
      return reply.status(404).send({ error: 'Player not found' });
    }
    
    return stats;
  });
  
  // Get player's games
  app.get('/players/:address/games', async (request: FastifyRequest<{ Params: PlayerParams; Querystring: LeaderboardQuery }>, reply: FastifyReply) => {
    const { address } = request.params;
    const limit = request.query.limit || 20;
    
    const games = db.getPlayerGames(address, limit);
    
    return {
      games: games.map(g => getPublicGameState(g, address)),
      count: games.length,
    };
  });
  
  // Get matchmaking stats
  app.get('/matchmaking/stats', async () => {
    return matchmaking.getStats();
  });
}
