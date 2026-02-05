#!/usr/bin/env npx ts-node
/**
 * Word Duel Bot Example
 * 
 * A simple bot that continuously searches for games,
 * joins them, plays using the information theory strategy,
 * and claims winnings.
 * 
 * Usage:
 *   PRIVATE_KEY=0x... CONTRACT_ADDRESS=0x... npx ts-node examples/bot.ts
 */

import { 
  WordDuelClient, 
  strategies, 
  type GameState 
} from '../src'
import { formatEther } from 'viem'

// Configuration from environment
const config = {
  rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  contractAddress: process.env.CONTRACT_ADDRESS as `0x${string}`,
  maxEntryFee: process.env.MAX_ENTRY_FEE || '0.01',
  strategy: process.env.STRATEGY || 'adaptive'
}

// Validate config
if (!config.privateKey) {
  console.error('❌ PRIVATE_KEY environment variable required')
  process.exit(1)
}
if (!config.contractAddress) {
  console.error('❌ CONTRACT_ADDRESS environment variable required')
  process.exit(1)
}

// Create client
const client = new WordDuelClient({
  rpcUrl: config.rpcUrl,
  privateKey: config.privateKey,
  contractAddress: config.contractAddress
})

// Select strategy
const strategyMap = {
  random: strategies.random,
  frequency: strategies.frequency,
  informationTheory: strategies.informationTheory,
  adaptive: strategies.adaptive,
  hardMode: strategies.hardMode
}
const selectedStrategy = strategyMap[config.strategy as keyof typeof strategyMap] || strategies.adaptive

// Event handlers
client.on('gameJoined', (state: GameState) => {
  console.log(`\n🎮 Joined game #${state.id}`)
  console.log(`   Entry fee: ${formatEther(state.entryFee)} ETH`)
  console.log(`   Opponent: ${state.player1 === client.address ? state.player2 : state.player1}`)
})

client.on('yourTurn', (state: GameState) => {
  console.log(`\n🎯 Round ${state.currentRound} - Your turn`)
})

client.on('guessSubmitted', (guess: string, state: GameState) => {
  const myGuesses = state.player1 === client.address 
    ? state.player1Guesses 
    : state.player2Guesses
  const latest = myGuesses[myGuesses.length - 1]
  
  if (latest) {
    const colored = latest.feedback.map((f, i) => {
      const letter = guess[i].toUpperCase()
      switch (f) {
        case 'correct': return `\x1b[32m${letter}\x1b[0m` // Green
        case 'present': return `\x1b[33m${letter}\x1b[0m` // Yellow
        default: return `\x1b[90m${letter}\x1b[0m`        // Gray
      }
    }).join('')
    console.log(`   Guess: ${colored}`)
  }
})

client.on('gameEnded', (state: GameState, won: boolean) => {
  console.log(`\n${won ? '🎉 VICTORY!' : '😢 Defeat'}`)
  console.log(`   Final score: ${state.player1Score} - ${state.player2Score}`)
  if (won) {
    console.log(`   Prize: ${formatEther(state.entryFee * BigInt(2))} ETH`)
  }
})

client.on('error', (error: Error) => {
  console.error(`\n❌ Error: ${error.message}`)
})

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Main bot loop
async function runBot() {
  console.log('🤖 Word Duel Bot Starting')
  console.log(`   Address: ${client.address}`)
  console.log(`   Strategy: ${selectedStrategy.name}`)
  console.log(`   Max entry: ${config.maxEntryFee} ETH`)
  console.log('')

  let gamesPlayed = 0
  let gamesWon = 0

  while (true) {
    try {
      console.log('🔍 Searching for games...')
      
      const game = await client.findGame({ 
        maxEntryFee: config.maxEntryFee 
      })
      
      if (game) {
        // Estimate gas
        const estimate = await client.estimateJoinGameGas(game.id)
        console.log(`   Found game #${game.id}, fee: ${formatEther(game.entryFee)} ETH`)
        console.log(`   Est. gas: ${formatEther(estimate.estimatedCost)} ETH`)
        
        // Join the game
        await client.joinGame(game.id)
        
        // Play with strategy
        const result = await client.playWithStrategy(selectedStrategy)
        
        // Update stats
        gamesPlayed++
        if (result.winner === client.address) {
          gamesWon++
          
          // Claim winnings
          console.log('💰 Claiming winnings...')
          const claimResult = await client.claimIfWon()
          if (claimResult?.success) {
            console.log(`   ✅ Claimed! TX: ${claimResult.hash}`)
          }
        }
        
        console.log(`\n📊 Stats: ${gamesWon}/${gamesPlayed} wins (${Math.round(gamesWon/gamesPlayed*100)}%)`)
      } else {
        console.log('   No games found, waiting...')
      }
      
      // Wait before searching again
      await sleep(10000)
      
    } catch (error) {
      console.error(`\n❌ Error: ${(error as Error).message}`)
      await sleep(30000) // Longer wait on error
    }
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...')
  client.destroy()
  process.exit(0)
})

// Start the bot
runBot().catch(console.error)
