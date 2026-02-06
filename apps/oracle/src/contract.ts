/**
 * Contract Interface
 * 
 * Handles interaction with the WordDuelArenaV2 contract.
 */

import { ethers, Contract, Provider, Wallet, EventLog } from 'ethers';
import { logger } from './logger';

// Minimal ABI for oracle operations
const CONTRACT_ABI = [
  // Events
  'event GuessRevealed(uint256 indexed roundId, address indexed player, uint8 guessNum, bytes5 guess)',
  'event FeedbackSubmitted(uint256 indexed roundId, address indexed player, uint8 guessNum, uint40 feedback)',
  'event RoundCreated(uint256 indexed roundId, address indexed player1, address indexed player2)',
  'event RoundEnded(uint256 indexed roundId, address winner)',
  
  // Functions
  'function submitFeedback(uint256 roundId, address player, uint8 guessNum, uint40 feedback, bytes signature) external',
  'function oracle() external view returns (address)',
  'function rounds(uint256) external view returns (address player1, address player2, uint256 stake, uint8 status, bytes32 commitHash1, bytes32 commitHash2)',
];

export interface GuessRevealedEvent {
  roundId: bigint;
  player: string;
  guessNum: number;
  guess: string; // bytes5 as hex string
  blockNumber: number;
  transactionHash: string;
}

export class ContractInterface {
  private provider: Provider;
  private contract: Contract;
  private signer?: Wallet;

  constructor(
    rpcUrl: string,
    contractAddress: string,
    privateKey?: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.provider);

    if (privateKey) {
      this.signer = new Wallet(privateKey, this.provider);
      this.contract = this.contract.connect(this.signer) as Contract;
      logger.info(`Contract interface connected with signer: ${this.signer.address}`);
    }

    logger.info(`Contract interface initialized for: ${contractAddress}`);
  }

  /**
   * Gets the configured oracle address from the contract.
   */
  async getOracleAddress(): Promise<string> {
    return await this.contract.oracle();
  }

  /**
   * Submits signed feedback to the contract.
   */
  async submitFeedback(
    roundId: bigint,
    player: string,
    guessNum: number,
    feedback: bigint,
    signature: string
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer configured for contract submission');
    }

    logger.info(`Submitting feedback to contract...`);
    logger.debug(`  roundId: ${roundId}`);
    logger.debug(`  player: ${player}`);
    logger.debug(`  guessNum: ${guessNum}`);
    logger.debug(`  feedback: ${feedback}`);

    try {
      const tx = await this.contract.submitFeedback(
        roundId,
        player,
        guessNum,
        feedback,
        signature
      );

      logger.info(`Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);

      return tx.hash;
    } catch (error: any) {
      logger.error(`Failed to submit feedback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Listens for GuessRevealed events.
   */
  onGuessRevealed(callback: (event: GuessRevealedEvent) => void): void {
    this.contract.on('GuessRevealed', (roundId, player, guessNum, guess, event: EventLog) => {
      const parsed: GuessRevealedEvent = {
        roundId: BigInt(roundId),
        player,
        guessNum: Number(guessNum),
        guess,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      };

      logger.info(`GuessRevealed event received:`, {
        roundId: parsed.roundId.toString(),
        player: parsed.player,
        guessNum: parsed.guessNum,
        guess: parsed.guess
      });

      callback(parsed);
    });

    logger.info('Listening for GuessRevealed events...');
  }

  /**
   * Queries past GuessRevealed events.
   */
  async getPastGuessRevealedEvents(fromBlock: number, toBlock: number | 'latest'): Promise<GuessRevealedEvent[]> {
    const filter = this.contract.filters.GuessRevealed();
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

    return events.map((event: any) => ({
      roundId: BigInt(event.args[0]),
      player: event.args[1],
      guessNum: Number(event.args[2]),
      guess: event.args[3],
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }));
  }

  /**
   * Gets the current block number.
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Removes all event listeners.
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}
