/**
 * Simple Usage Example
 * 
 * Minimal example showing basic SDK usage.
 */

import { WordDuelClient, strategies } from '../src'

async function main() {
  // Initialize client
  const client = new WordDuelClient({
    rpcUrl: 'https://mainnet.base.org',
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    contractAddress: process.env.CONTRACT_ADDRESS as `0x${string}`
  })

  console.log(`🎮 Address: ${client.address}`)

  // Option 1: Find and join existing game
  const game = await client.findGame({ maxEntryFee: '0.01' })
  
  if (game) {
    console.log(`Found game #${game.id}`)
    await client.joinGame(game.id)
    
    // Play with optimal strategy
    const result = await client.playWithStrategy(strategies.informationTheory)
    
    if (result.winner === client.address) {
      console.log('🎉 Won!')
      await client.claimIfWon()
    }
  } else {
    // Option 2: Create a new game
    console.log('No games found, creating one...')
    
    const { gameId } = await client.createGame({
      targetWord: 'crane', // Your secret word
      entryFee: '0.005',
      maxRounds: 6
    })
    
    console.log(`Created game #${gameId}, waiting for opponent...`)
  }

  // Cleanup
  client.destroy()
}

main().catch(console.error)
