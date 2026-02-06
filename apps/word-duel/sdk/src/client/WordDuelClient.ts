import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  type Hex,
  type TransactionReceipt
} from 'viem'
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts'
import { base, baseSepolia, mainnet } from 'viem/chains'
import EventEmitter from 'eventemitter3'

import { WORD_DUEL_ABI } from '../constants/abi'
import { WordUtils } from '../utils/wordUtils'
import { createCommitData, wordToBytes32, bytes32ToWord, hashWord, generateSalt } from '../utils/crypto'
import type {
  WordDuelClientConfig,
  GameState,
  GameFilter,
  GameStatus,
  GuessFeedback,
  LetterFeedback,
  Strategy,
  StrategyContext,
  TransactionResult,
  GasEstimate,
  CommitData,
  WordDuelEventMap
} from '../types'

// Status enum mapping from contract
const STATUS_MAP: Record<number, GameStatus> = {
  0: 'waiting',
  1: 'active',
  2: 'revealing',
  3: 'finished',
  4: 'expired',
  5: 'cancelled'
}

/**
 * Word Duel SDK Client
 * 
 * Full-featured client for playing Word Duel on-chain.
 * Supports finding games, joining, playing with strategies,
 * and claiming winnings.
 */
export class WordDuelClient extends EventEmitter<WordDuelEventMap> {
  private publicClient: PublicClient
  private walletClient: WalletClient
  private account: PrivateKeyAccount
  private contractAddress: Address
  private wordUtils: WordUtils
  private gasPriceMultiplier: number
  private pollingInterval: number
  
  // Current game state
  private currentGameId: bigint | null = null
  private currentGameState: GameState | null = null
  private pendingCommits: Map<number, CommitData> = new Map()
  private pollingTimer: NodeJS.Timeout | null = null

  constructor(config: WordDuelClientConfig) {
    super()
    
    // Detect chain from RPC URL
    const chain = this.detectChain(config.rpcUrl)
    
    // Create viem clients
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl)
    })
    
    this.account = privateKeyToAccount(config.privateKey)
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain,
      transport: http(config.rpcUrl)
    })
    
    this.contractAddress = config.contractAddress
    this.wordUtils = new WordUtils(config.wordList)
    this.gasPriceMultiplier = config.gasPriceMultiplier ?? 1.1
    this.pollingInterval = config.pollingInterval ?? 3000
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get address(): Address {
    return this.account.address
  }

  get gameId(): bigint | null {
    return this.currentGameId
  }

  get gameState(): GameState | null {
    return this.currentGameState
  }

  getWordUtils(): WordUtils {
    return this.wordUtils
  }

  // ============================================================================
  // Game Discovery
  // ============================================================================

  /**
   * Find an open game matching criteria
   */
  async findGame(filter?: GameFilter): Promise<GameState | null> {
    const gameIds = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'getOpenGames',
      args: [BigInt(0), BigInt(100)]
    }) as bigint[]
    
    for (const gameId of gameIds) {
      const state = await this.getGameState(gameId)
      
      if (!state || state.status !== 'waiting') continue
      if (state.player1 === this.address) continue // Can't join own game
      if (filter?.excludePlayer && state.player1 === filter.excludePlayer) continue
      
      if (filter?.maxEntryFee) {
        const max = typeof filter.maxEntryFee === 'string' 
          ? parseEther(filter.maxEntryFee)
          : filter.maxEntryFee
        if (state.entryFee > max) continue
      }
      
      if (filter?.minEntryFee) {
        const min = typeof filter.minEntryFee === 'string'
          ? parseEther(filter.minEntryFee)
          : filter.minEntryFee
        if (state.entryFee < min) continue
      }
      
      return state
    }
    
    return null
  }

  /**
   * Get all open games
   */
  async getOpenGames(limit = 50): Promise<GameState[]> {
    const gameIds = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'getOpenGames',
      args: [BigInt(0), BigInt(limit)]
    }) as bigint[]
    
    const games: GameState[] = []
    for (const id of gameIds) {
      const state = await this.getGameState(id)
      if (state && state.status === 'waiting') {
        games.push(state)
      }
    }
    
    return games
  }

  /**
   * Get state of a specific game
   */
  async getGameState(gameId: bigint): Promise<GameState | null> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: WORD_DUEL_ABI,
        functionName: 'getGame',
        args: [gameId]
      }) as [Address, Address, bigint, number, number, number, bigint, number, number, Address, Hex]
      
      const [
        player1, player2, entryFee, status, currentRound, maxRounds,
        turnDeadline, player1Score, player2Score, winner
      ] = result
      
      // Get guesses for both players
      const p1Guesses = await this.getPlayerGuesses(gameId, player1)
      const p2Guesses = player2 !== '0x0000000000000000000000000000000000000000'
        ? await this.getPlayerGuesses(gameId, player2)
        : []
      
      return {
        id: gameId,
        player1,
        player2: player2 === '0x0000000000000000000000000000000000000000' ? null : player2,
        entryFee,
        status: STATUS_MAP[status] || 'waiting',
        currentRound,
        maxRounds,
        turnDeadline,
        player1Guesses: p1Guesses,
        player2Guesses: p2Guesses,
        player1Score,
        player2Score,
        winner: winner === '0x0000000000000000000000000000000000000000' ? null : winner
      }
    } catch (error) {
      console.error('Failed to get game state:', error)
      return null
    }
  }

  // ============================================================================
  // Game Actions
  // ============================================================================

  /**
   * Create a new game
   */
  async createGame(options: {
    targetWord: string
    entryFee: string | bigint
    maxRounds?: number
  }): Promise<TransactionResult & { gameId: bigint }> {
    const entryFee = typeof options.entryFee === 'string'
      ? parseEther(options.entryFee)
      : options.entryFee
    
    const salt = generateSalt()
    const targetWordHash = hashWord(options.targetWord, salt)
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'createGame',
      args: [targetWordHash, options.maxRounds ?? 6],
      value: entryFee
    })
    
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
    
    // Extract game ID from logs
    const gameId = this.extractGameIdFromReceipt(receipt)
    
    if (gameId) {
      this.currentGameId = gameId
      await this.refreshGameState()
    }
    
    return {
      hash,
      success: receipt.status === 'success',
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      gameId: gameId ?? BigInt(0)
    }
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId: bigint): Promise<TransactionResult> {
    const state = await this.getGameState(gameId)
    if (!state) throw new Error('Game not found')
    if (state.status !== 'waiting') throw new Error('Game is not open for joining')
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'joinGame',
      args: [gameId],
      value: state.entryFee
    })
    
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'success') {
      this.currentGameId = gameId
      await this.refreshGameState()
      this.emit('gameJoined', this.currentGameState!)
      this.startPolling()
    }
    
    return {
      hash,
      success: receipt.status === 'success',
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber
    }
  }

  /**
   * Submit a guess (handles commit-reveal automatically)
   */
  async submitGuess(guess: string): Promise<TransactionResult> {
    if (!this.currentGameId || !this.currentGameState) {
      throw new Error('No active game')
    }
    
    const word = guess.toLowerCase()
    if (!this.wordUtils.isValidWord(word)) {
      throw new Error(`Invalid word: ${word}`)
    }
    
    // Create commitment
    const commitData = createCommitData(word)
    const round = this.currentGameState.currentRound
    
    // Store for later reveal
    this.pendingCommits.set(round, commitData)
    
    // Submit commitment
    const commitHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'commitGuess',
      args: [this.currentGameId, commitData.commitment]
    })
    
    const commitReceipt = await this.publicClient.waitForTransactionReceipt({ hash: commitHash })
    
    if (commitReceipt.status !== 'success') {
      throw new Error('Commit transaction failed')
    }
    
    // Wait for opponent's commit (poll until both committed or timeout)
    await this.waitForRevealPhase()
    
    // Submit reveal
    const guessBytes = wordToBytes32(word)
    const revealHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'revealGuess',
      args: [this.currentGameId, guessBytes, commitData.salt]
    })
    
    const revealReceipt = await this.publicClient.waitForTransactionReceipt({ hash: revealHash })
    
    await this.refreshGameState()
    this.emit('guessSubmitted', word, this.currentGameState!)
    
    return {
      hash: revealHash,
      success: revealReceipt.status === 'success',
      gasUsed: commitReceipt.gasUsed + revealReceipt.gasUsed,
      blockNumber: revealReceipt.blockNumber
    }
  }

  /**
   * Play a full game with a strategy
   */
  async playWithStrategy(strategy: Strategy): Promise<GameState> {
    if (!this.currentGameId || !this.currentGameState) {
      throw new Error('No active game. Call joinGame or createGame first.')
    }
    
    const myAddress = this.address
    let candidates = this.wordUtils.getWordList()
    const myGuesses: GuessFeedback[] = []
    
    while (this.currentGameState.status === 'active') {
      await this.refreshGameState()
      
      // Check if it's our turn
      const isMyTurn = this.isMyTurn()
      if (!isMyTurn) {
        this.emit('opponentTurn', this.currentGameState)
        await this.waitForMyTurn()
        continue
      }
      
      // Update candidates based on feedback
      if (myGuesses.length > 0) {
        candidates = this.wordUtils.filterByFeedback(candidates, myGuesses)
      }
      
      // Build strategy context
      const context: StrategyContext = {
        gameState: this.currentGameState,
        myGuesses,
        candidates,
        round: this.currentGameState.currentRound,
        wordUtils: this.wordUtils
      }
      
      this.emit('yourTurn', this.currentGameState)
      
      // Get guess from strategy
      const guess = await strategy.selectGuess(context)
      
      // Submit the guess
      await this.submitGuess(guess)
      
      // Get feedback and add to history
      await this.refreshGameState()
      const latestFeedback = this.getMyLatestFeedback()
      if (latestFeedback) {
        myGuesses.push(latestFeedback)
      }
      
      this.emit('roundComplete', this.currentGameState.currentRound, this.currentGameState)
    }
    
    const won = this.currentGameState.winner === myAddress
    this.emit('gameEnded', this.currentGameState, won)
    this.stopPolling()
    
    return this.currentGameState
  }

  /**
   * Claim winnings if you won
   */
  async claimIfWon(): Promise<TransactionResult | null> {
    if (!this.currentGameId || !this.currentGameState) {
      throw new Error('No active game')
    }
    
    if (this.currentGameState.status !== 'finished') {
      return null
    }
    
    if (this.currentGameState.winner !== this.address) {
      return null
    }
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'claimWinnings',
      args: [this.currentGameId]
    })
    
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
    
    return {
      hash,
      success: receipt.status === 'success',
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber
    }
  }

  /**
   * Claim timeout win if opponent didn't respond
   */
  async claimTimeout(): Promise<TransactionResult> {
    if (!this.currentGameId) {
      throw new Error('No active game')
    }
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'claimTimeout',
      args: [this.currentGameId]
    })
    
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
    
    return {
      hash,
      success: receipt.status === 'success',
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber
    }
  }

  /**
   * Cancel a game you created (before opponent joins)
   */
  async cancelGame(): Promise<TransactionResult> {
    if (!this.currentGameId) {
      throw new Error('No active game')
    }
    
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'cancelGame',
      args: [this.currentGameId]
    })
    
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
    this.stopPolling()
    
    return {
      hash,
      success: receipt.status === 'success',
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber
    }
  }

  // ============================================================================
  // Gas Estimation
  // ============================================================================

  /**
   * Estimate gas for joining a game
   */
  async estimateJoinGameGas(gameId: bigint): Promise<GasEstimate> {
    const state = await this.getGameState(gameId)
    if (!state) throw new Error('Game not found')
    
    const gasLimit = await this.publicClient.estimateContractGas({
      address: this.contractAddress,
      abi: WORD_DUEL_ABI,
      functionName: 'joinGame',
      args: [gameId],
      value: state.entryFee,
      account: this.account
    })
    
    return this.buildGasEstimate(gasLimit)
  }

  /**
   * Estimate gas for submitting a guess
   */
  async estimateGuessGas(): Promise<GasEstimate> {
    // Commit + reveal estimated together
    const commitGas = BigInt(80000)
    const revealGas = BigInt(120000)
    return this.buildGasEstimate(commitGas + revealGas)
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private detectChain(rpcUrl: string) {
    if (rpcUrl.includes('base-sepolia') || rpcUrl.includes('sepolia.base')) {
      return baseSepolia
    }
    if (rpcUrl.includes('base.org') || rpcUrl.includes('base-mainnet')) {
      return base
    }
    return mainnet
  }

  private async buildGasEstimate(gasLimit: bigint): Promise<GasEstimate> {
    const feeData = await this.publicClient.estimateFeesPerGas()
    
    const maxFeePerGas = feeData.maxFeePerGas ?? BigInt(0)
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? BigInt(0)
    
    // Apply multiplier
    const adjustedMaxFee = BigInt(Math.floor(Number(maxFeePerGas) * this.gasPriceMultiplier))
    
    return {
      gasLimit,
      gasPrice: maxFeePerGas,
      maxFeePerGas: adjustedMaxFee,
      maxPriorityFeePerGas,
      estimatedCost: gasLimit * adjustedMaxFee
    }
  }

  private async getPlayerGuesses(gameId: bigint, player: Address): Promise<GuessFeedback[]> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: WORD_DUEL_ABI,
        functionName: 'getPlayerGuesses',
        args: [gameId, player]
      }) as [Hex[], number[][]]
      
      const [guessBytes, feedbackArrays] = result
      
      return guessBytes.map((bytes, i) => ({
        guess: bytes32ToWord(bytes),
        feedback: feedbackArrays[i].map(f => this.feedbackFromNumber(f))
      }))
    } catch {
      return []
    }
  }

  private feedbackFromNumber(n: number): LetterFeedback {
    switch (n) {
      case 2: return 'correct'
      case 1: return 'present'
      default: return 'absent'
    }
  }

  private extractGameIdFromReceipt(receipt: TransactionReceipt): bigint | null {
    // Look for GameCreated event
    for (const log of receipt.logs) {
      try {
        // First indexed parameter is gameId
        if (log.topics[0] && log.topics[1]) {
          return BigInt(log.topics[1])
        }
      } catch {
        continue
      }
    }
    return null
  }

  private async refreshGameState(): Promise<void> {
    if (!this.currentGameId) return
    
    const state = await this.getGameState(this.currentGameId)
    if (state) {
      this.currentGameState = state
      this.emit('stateUpdate', state)
    }
  }

  private isMyTurn(): boolean {
    if (!this.currentGameState) return false
    
    const myGuessCount = this.currentGameState.player1 === this.address
      ? this.currentGameState.player1Guesses.length
      : this.currentGameState.player2Guesses.length
    
    return myGuessCount < this.currentGameState.currentRound
  }

  private getMyLatestFeedback(): GuessFeedback | null {
    if (!this.currentGameState) return null
    
    const myGuesses = this.currentGameState.player1 === this.address
      ? this.currentGameState.player1Guesses
      : this.currentGameState.player2Guesses
    
    return myGuesses[myGuesses.length - 1] ?? null
  }

  private async waitForRevealPhase(): Promise<void> {
    // Poll until both players committed or timeout
    const maxAttempts = 60 // 3 minutes at 3s intervals
    
    for (let i = 0; i < maxAttempts; i++) {
      await this.refreshGameState()
      
      if (this.currentGameState?.status === 'revealing') {
        return
      }
      
      await this.sleep(this.pollingInterval)
    }
    
    throw new Error('Timeout waiting for reveal phase')
  }

  private async waitForMyTurn(): Promise<void> {
    const maxAttempts = 120 // 6 minutes
    
    for (let i = 0; i < maxAttempts; i++) {
      await this.refreshGameState()
      
      if (!this.currentGameState || this.currentGameState.status !== 'active') {
        return
      }
      
      if (this.isMyTurn()) {
        return
      }
      
      await this.sleep(this.pollingInterval)
    }
    
    throw new Error('Timeout waiting for turn')
  }

  private startPolling(): void {
    if (this.pollingTimer) return
    
    this.pollingTimer = setInterval(async () => {
      await this.refreshGameState()
    }, this.pollingInterval)
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPolling()
    this.removeAllListeners()
  }
}
