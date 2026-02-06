/**
 * Express API Server
 * 
 * Exposes endpoints for:
 * - Setting target words for rounds
 * - Getting signed feedback (if not auto-submitting)
 * - Health checks
 */

import express, { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { getWordStorage } from './wordStore';
import { evaluateGuess, packFeedback, decodeGuess } from './evaluator';
import { OracleSigner, SignedFeedback } from './signer';

export interface ApiConfig {
  port: number;
  signer: OracleSigner;
}

export function createApiServer(config: ApiConfig): express.Express {
  const app = express();
  const { signer } = config;
  const wordStore = getWordStorage();

  app.use(express.json());

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.path}`, { body: req.body });
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      oracle: signer.getAddress(),
      timestamp: new Date().toISOString()
    });
  });

  // Get oracle address
  app.get('/oracle', (_req: Request, res: Response) => {
    res.json({
      address: signer.getAddress()
    });
  });

  // Set target word for a round
  app.post('/rounds/:roundId/word', (req: Request, res: Response) => {
    try {
      const roundId = BigInt(req.params.roundId);
      const { word } = req.body;

      if (!word || typeof word !== 'string' || word.length !== 5) {
        res.status(400).json({ error: 'Invalid word: must be 5 letters' });
        return;
      }

      if (!/^[a-zA-Z]+$/.test(word)) {
        res.status(400).json({ error: 'Invalid word: must contain only letters' });
        return;
      }

      wordStore.setWord(roundId, word);
      
      res.json({
        success: true,
        roundId: roundId.toString(),
        message: 'Target word set'
      });
    } catch (error: any) {
      logger.error('Failed to set word:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Evaluate a guess and get signed feedback
  app.post('/evaluate', async (req: Request, res: Response) => {
    try {
      const { roundId, player, guessNum, guess } = req.body;

      if (!roundId || !player || guessNum === undefined || !guess) {
        res.status(400).json({ 
          error: 'Missing required fields: roundId, player, guessNum, guess' 
        });
        return;
      }

      const roundIdBigInt = BigInt(roundId);
      const targetWord = wordStore.getWord(roundIdBigInt);

      if (!targetWord) {
        res.status(404).json({ error: `No target word set for round ${roundId}` });
        return;
      }

      // Decode guess if it's bytes5 hex, otherwise use as-is
      const guessStr = guess.startsWith('0x') ? decodeGuess(guess) : guess.toUpperCase();

      if (guessStr.length !== 5) {
        res.status(400).json({ error: 'Invalid guess: must be 5 letters' });
        return;
      }

      // Evaluate and pack feedback
      const feedback = evaluateGuess(guessStr, targetWord);
      const packedFeedback = packFeedback(feedback);

      // Sign the feedback
      const signed = await signer.signFeedback(
        roundIdBigInt,
        player,
        Number(guessNum),
        packedFeedback
      );

      res.json({
        roundId: signed.roundId.toString(),
        player: signed.player,
        guessNum: signed.guessNum,
        guess: guessStr,
        feedback: feedback,
        packedFeedback: signed.feedback.toString(),
        packedFeedbackHex: '0x' + signed.feedback.toString(16).padStart(10, '0'),
        signature: signed.signature,
        messageHash: signed.messageHash
      });
    } catch (error: any) {
      logger.error('Failed to evaluate guess:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get round info
  app.get('/rounds/:roundId', (req: Request, res: Response) => {
    try {
      const roundId = BigInt(req.params.roundId);
      const hasWord = wordStore.hasRound(roundId);

      res.json({
        roundId: roundId.toString(),
        hasTargetWord: hasWord
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List active rounds
  app.get('/rounds', (_req: Request, res: Response) => {
    try {
      const rounds = wordStore.getActiveRounds();
      res.json({
        rounds: rounds.map(r => ({
          roundId: r.roundId,
          status: r.status,
          createdAt: r.createdAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

export function startApiServer(app: express.Express, port: number): void {
  app.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
    logger.info(`Endpoints:`);
    logger.info(`  GET  /health - Health check`);
    logger.info(`  GET  /oracle - Get oracle address`);
    logger.info(`  POST /rounds/:roundId/word - Set target word`);
    logger.info(`  POST /evaluate - Evaluate guess and get signed feedback`);
    logger.info(`  GET  /rounds/:roundId - Get round info`);
    logger.info(`  GET  /rounds - List active rounds`);
  });
}
