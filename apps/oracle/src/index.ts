/**
 * WordDuelArenaV2 Oracle Service
 * 
 * Main entry point that:
 * 1. Watches for GuessRevealed events
 * 2. Evaluates guesses against target words
 * 3. Signs and submits feedback to the contract
 * 4. Optionally exposes API for manual operations
 */

import dotenv from 'dotenv';
dotenv.config();

import { logger } from './logger';
import { OracleSigner } from './signer';
import { ContractInterface, GuessRevealedEvent } from './contract';
import { evaluateGuess, packFeedback, decodeGuess, isWinningFeedback } from './evaluator';
import { getWordStorage } from './wordStore';
import { createApiServer, startApiServer } from './api';

// Configuration from environment
const config = {
  rpcUrl: process.env.RPC_URL || '',
  privateKey: process.env.ORACLE_PRIVATE_KEY || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  apiPort: parseInt(process.env.API_PORT || '3000', 10),
  autoSubmit: process.env.AUTO_SUBMIT !== 'false',
};

// Validate configuration
function validateConfig(): void {
  const missing: string[] = [];
  
  if (!config.rpcUrl) missing.push('RPC_URL');
  if (!config.privateKey) missing.push('ORACLE_PRIVATE_KEY');
  if (!config.contractAddress) missing.push('CONTRACT_ADDRESS');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Process a revealed guess
async function processGuessRevealed(
  event: GuessRevealedEvent,
  signer: OracleSigner,
  contract: ContractInterface
): Promise<void> {
  const wordStore = getWordStorage();
  
  try {
    // Get target word for this round
    const targetWord = wordStore.getWord(event.roundId);
    
    if (!targetWord) {
      logger.warn(`No target word found for round ${event.roundId}`);
      return;
    }

    // Decode the guess from bytes5
    const guessStr = decodeGuess(event.guess);
    logger.info(`Processing guess: "${guessStr}" for round ${event.roundId}`);

    // Evaluate the guess
    const feedback = evaluateGuess(guessStr, targetWord);
    const packedFeedback = packFeedback(feedback);

    logger.info(`Feedback: [${feedback.join(',')}] = 0x${packedFeedback.toString(16).padStart(10, '0')}`);

    // Check for win
    if (isWinningFeedback(feedback)) {
      logger.info(`🎉 Player ${event.player} guessed correctly in round ${event.roundId}!`);
    }

    // Sign the feedback
    const signed = await signer.signFeedback(
      event.roundId,
      event.player,
      event.guessNum,
      packedFeedback
    );

    // Submit to contract if auto-submit is enabled
    if (config.autoSubmit) {
      try {
        const txHash = await contract.submitFeedback(
          signed.roundId,
          signed.player,
          signed.guessNum,
          signed.feedback,
          signed.signature
        );
        logger.info(`Feedback submitted successfully: ${txHash}`);
      } catch (submitError: any) {
        // Check if already submitted (common case for replayed events)
        if (submitError.message?.includes('already submitted') || 
            submitError.message?.includes('feedback exists')) {
          logger.warn(`Feedback already submitted for round ${event.roundId}, guess #${event.guessNum}`);
        } else {
          throw submitError;
        }
      }
    } else {
      logger.info(`Auto-submit disabled. Signed feedback available via API.`);
      logger.debug(`Signature: ${signed.signature}`);
    }

  } catch (error: any) {
    logger.error(`Failed to process guess for round ${event.roundId}:`, error);
  }
}

// Main function
async function main(): Promise<void> {
  logger.info('='.repeat(60));
  logger.info('WordDuelArenaV2 Oracle Service Starting...');
  logger.info('='.repeat(60));

  // Validate config
  validateConfig();

  // Initialize signer
  const signer = new OracleSigner(config.privateKey);
  logger.info(`Oracle address: ${signer.getAddress()}`);

  // Initialize contract interface
  const contract = new ContractInterface(
    config.rpcUrl,
    config.contractAddress,
    config.privateKey
  );

  // Verify oracle address matches contract
  try {
    const contractOracle = await contract.getOracleAddress();
    if (contractOracle.toLowerCase() !== signer.getAddress().toLowerCase()) {
      logger.warn(`⚠️  Oracle address mismatch!`);
      logger.warn(`   Contract oracle: ${contractOracle}`);
      logger.warn(`   Our address:     ${signer.getAddress()}`);
      logger.warn(`   Signatures may be rejected by the contract.`);
    } else {
      logger.info(`✓ Oracle address verified on contract`);
    }
  } catch (error: any) {
    logger.warn(`Could not verify oracle address: ${error.message}`);
  }

  // Start API server
  const api = createApiServer({ port: config.apiPort, signer });
  startApiServer(api, config.apiPort);

  // Listen for events
  contract.onGuessRevealed(async (event) => {
    await processGuessRevealed(event, signer, contract);
  });

  logger.info('');
  logger.info('Oracle service is running.');
  logger.info(`Auto-submit: ${config.autoSubmit ? 'ENABLED' : 'DISABLED'}`);
  logger.info('');
  logger.info('To set a target word for a round:');
  logger.info(`  curl -X POST http://localhost:${config.apiPort}/rounds/1/word -H "Content-Type: application/json" -d '{"word":"HELLO"}'`);
  logger.info('');

  // Handle shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    contract.removeAllListeners();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Run
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
