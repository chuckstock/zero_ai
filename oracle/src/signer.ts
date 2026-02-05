/**
 * ECDSA Signing for Oracle Feedback
 * 
 * Signs feedback data that can be verified on-chain.
 * Message format: keccak256(abi.encodePacked(roundId, player, guessNum, feedback))
 */

import { ethers, Wallet, solidityPackedKeccak256, getBytes } from 'ethers';
import { logger } from './logger';

export interface SignedFeedback {
  roundId: bigint;
  player: string;
  guessNum: number;
  feedback: bigint;
  signature: string;
  messageHash: string;
}

export class OracleSigner {
  private wallet: Wallet;
  public readonly address: string;

  constructor(privateKey: string) {
    this.wallet = new Wallet(privateKey);
    this.address = this.wallet.address;
    logger.info(`Oracle signer initialized: ${this.address}`);
  }

  /**
   * Signs feedback data for on-chain verification.
   * 
   * The message hash is: keccak256(abi.encodePacked(roundId, player, guessNum, feedback))
   * This matches the contract's verification logic.
   * 
   * @param roundId - Round identifier
   * @param player - Player address
   * @param guessNum - Guess number (1-6)
   * @param feedback - Packed uint40 feedback
   * @returns Signed feedback with signature
   */
  async signFeedback(
    roundId: bigint,
    player: string,
    guessNum: number,
    feedback: bigint
  ): Promise<SignedFeedback> {
    // Create the message hash matching contract's expectation
    // abi.encodePacked(uint256, address, uint8, uint40)
    const messageHash = solidityPackedKeccak256(
      ['uint256', 'address', 'uint8', 'uint40'],
      [roundId, player, guessNum, feedback]
    );

    logger.debug(`Signing message hash: ${messageHash}`);
    logger.debug(`  roundId: ${roundId}`);
    logger.debug(`  player: ${player}`);
    logger.debug(`  guessNum: ${guessNum}`);
    logger.debug(`  feedback: ${feedback} (0x${feedback.toString(16).padStart(10, '0')})`);

    // Sign the hash directly (not as Ethereum signed message)
    // The contract should use ecrecover on this hash
    const signature = await this.wallet.signMessage(getBytes(messageHash));

    logger.info(`Signed feedback for round ${roundId}, player ${player}, guess #${guessNum}`);

    return {
      roundId,
      player,
      guessNum,
      feedback,
      signature,
      messageHash
    };
  }

  /**
   * Verifies a signature locally (for testing).
   */
  verifySignature(signedFeedback: SignedFeedback): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(
        getBytes(signedFeedback.messageHash),
        signedFeedback.signature
      );
      return recoveredAddress.toLowerCase() === this.address.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Gets the signer's address for contract configuration.
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Connects the wallet to a provider for transaction submission.
   */
  connect(provider: ethers.Provider): Wallet {
    return this.wallet.connect(provider);
  }
}
