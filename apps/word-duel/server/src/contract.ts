// Smart contract integration

import { ethers } from 'ethers';
import { config } from './config';
import * as db from './db';

// Minimal ABI for Word Duel contract events
const WORD_DUEL_ABI = [
  'event GameCreated(uint256 indexed gameId, address indexed player1, uint256 stake)',
  'event GameJoined(uint256 indexed gameId, address indexed player2)',
  'event WordCommitted(uint256 indexed gameId, address indexed player, bytes32 wordHash)',
  'event GuessCommitted(uint256 indexed gameId, address indexed player, uint256 turn, bytes32 guessHash)',
  'event GuessRevealed(uint256 indexed gameId, address indexed player, uint256 turn, string guess)',
  'event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize)',
];

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

/**
 * Initialize contract connection
 */
export async function initContract(): Promise<void> {
  if (!config.rpcUrl || !config.contractAddress) {
    console.log('Contract integration disabled (no RPC URL or contract address)');
    return;
  }
  
  try {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    contract = new ethers.Contract(config.contractAddress, WORD_DUEL_ABI, provider);
    
    console.log(`Connected to contract at ${config.contractAddress}`);
    
    // Start event indexer
    startEventIndexer();
  } catch (err) {
    console.error('Failed to connect to contract:', err);
  }
}

/**
 * Index historical and new contract events
 */
async function startEventIndexer(): Promise<void> {
  if (!provider || !contract) return;
  
  const lastBlock = db.getLastProcessedBlock();
  const currentBlock = await provider.getBlockNumber();
  
  console.log(`Indexing events from block ${lastBlock} to ${currentBlock}`);
  
  // Index historical events
  if (lastBlock < currentBlock) {
    await indexEvents(lastBlock + 1, currentBlock);
  }
  
  // Listen for new events
  contract.on('GameCreated', async (gameId, player1, stake, event) => {
    const log = event.log;
    console.log(`GameCreated: ${gameId} by ${player1}`);
    db.saveContractEvent(
      'GameCreated',
      log.blockNumber,
      log.transactionHash,
      gameId.toString(),
      { player1, stake: stake.toString() }
    );
  });
  
  contract.on('GameJoined', async (gameId, player2, event) => {
    const log = event.log;
    console.log(`GameJoined: ${gameId} by ${player2}`);
    db.saveContractEvent(
      'GameJoined',
      log.blockNumber,
      log.transactionHash,
      gameId.toString(),
      { player2 }
    );
  });
  
  contract.on('GameEnded', async (gameId, winner, prize, event) => {
    const log = event.log;
    console.log(`GameEnded: ${gameId}, winner: ${winner}`);
    db.saveContractEvent(
      'GameEnded',
      log.blockNumber,
      log.transactionHash,
      gameId.toString(),
      { winner, prize: prize.toString() }
    );
  });
}

/**
 * Index events in a block range
 */
async function indexEvents(fromBlock: number, toBlock: number): Promise<void> {
  if (!contract) return;
  
  const batchSize = 1000;
  
  for (let start = fromBlock; start <= toBlock; start += batchSize) {
    const end = Math.min(start + batchSize - 1, toBlock);
    
    try {
      const gameCreatedFilter = contract.filters.GameCreated();
      const gameCreatedEvents = await contract.queryFilter(gameCreatedFilter, start, end);
      
      for (const event of gameCreatedEvents) {
        const log = event as ethers.EventLog;
        const [gameId, player1, stake] = log.args;
        db.saveContractEvent(
          'GameCreated',
          log.blockNumber,
          log.transactionHash,
          gameId.toString(),
          { player1, stake: stake.toString() }
        );
      }
      
      const gameEndedFilter = contract.filters.GameEnded();
      const gameEndedEvents = await contract.queryFilter(gameEndedFilter, start, end);
      
      for (const event of gameEndedEvents) {
        const log = event as ethers.EventLog;
        const [gameId, winner, prize] = log.args;
        db.saveContractEvent(
          'GameEnded',
          log.blockNumber,
          log.transactionHash,
          gameId.toString(),
          { winner, prize: prize.toString() }
        );
      }
      
      console.log(`Indexed blocks ${start}-${end}`);
    } catch (err) {
      console.error(`Error indexing blocks ${start}-${end}:`, err);
    }
  }
}

/**
 * Get contract instance for server-side operations
 */
export function getContract(): ethers.Contract | null {
  return contract;
}

/**
 * Get provider
 */
export function getProvider(): ethers.JsonRpcProvider | null {
  return provider;
}
