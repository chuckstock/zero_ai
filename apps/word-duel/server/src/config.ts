// Server configuration

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  dbPath: process.env.DB_PATH || './data/word-duel.db',
  
  // Game settings
  turnDuration: parseInt(process.env.TURN_DURATION || '120'), // 2 minutes per turn
  wordLength: 5,
  maxTurns: 6,
  
  // Contract
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  privateKey: process.env.SERVER_PRIVATE_KEY || '',
  
  // Matchmaking
  matchmakingTimeout: parseInt(process.env.MATCHMAKING_TIMEOUT || '300000'), // 5 minutes
};
