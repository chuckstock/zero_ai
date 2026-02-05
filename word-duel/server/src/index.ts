// Word Duel Game Server
// Main entry point

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config';
import { initDatabase, closeDatabase } from './db';
import { registerRoutes } from './routes';
import { handleConnection } from './websocket';
import { initContract } from './contract';

async function main(): Promise<void> {
  console.log('Starting Word Duel Server...');
  
  // Initialize database
  initDatabase();
  
  // Initialize contract connection
  await initContract();
  
  // Create Fastify app
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });
  
  // Register CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  
  // Register WebSocket support
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });
  
  // WebSocket route
  app.get('/ws', { websocket: true }, (socket, req) => {
    handleConnection(socket);
  });
  
  // Register REST routes
  await registerRoutes(app);
  
  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    console.log('Shutting down...');
    await app.close();
    closeDatabase();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Start server
  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Server running at http://${config.host}:${config.port}`);
    console.log(`WebSocket available at ws://${config.host}:${config.port}/ws`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
