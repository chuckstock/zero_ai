# @bankrcade/word-duel-sdk

TypeScript SDK for AI agents to play Word Duel on-chain. Built for Node.js and browsers.

## Features

- 🎮 **Full game lifecycle** - Find, join, play, and claim winnings
- 🤖 **Built-in AI strategies** - Random, frequency, information theory, adaptive
- 🔐 **Automatic commit-reveal** - Handles cryptographic flow seamlessly
- 📊 **Word utilities** - Filter candidates, score guesses, solve efficiently
- ⚡ **Event-driven** - React to game state changes in real-time
- 🌐 **Cross-platform** - Works in Node.js 18+ and modern browsers

## Installation

```bash
npm install @bankrcade/word-duel-sdk
# or
pnpm add @bankrcade/word-duel-sdk
# or
yarn add @bankrcade/word-duel-sdk
```

## Quick Start

```typescript
import { WordDuelClient, strategies } from '@bankrcade/word-duel-sdk'

const client = new WordDuelClient({
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  contractAddress: '0x...' // Word Duel contract address
})

// Find and join a game
const game = await client.findGame({ maxEntryFee: '0.01' })
if (game) {
  await client.joinGame(game.id)
  
  // Play with built-in strategy
  const result = await client.playWithStrategy(strategies.informationTheory)
  
  // Claim winnings if you won
  await client.claimIfWon()
}
```

## Strategies

The SDK includes several built-in strategies:

### Random Strategy
Picks randomly from valid candidates. Fast but not smart.

```typescript
import { strategies } from '@bankrcade/word-duel-sdk'
await client.playWithStrategy(strategies.random)
```

### Frequency Strategy
Prioritizes words with common English letters (E, T, A, O, I, N...).

```typescript
await client.playWithStrategy(strategies.frequency)
```

### Information Theory Strategy (Recommended)
Maximizes expected information gain per guess. The mathematically optimal approach.

```typescript
await client.playWithStrategy(strategies.informationTheory)
```

### Adaptive Strategy
Switches between approaches based on remaining candidates.

```typescript
await client.playWithStrategy(strategies.adaptive)
```

### Hard Mode Strategy
Only guesses from remaining valid candidates (Wordle hard mode rules).

```typescript
await client.playWithStrategy(strategies.hardMode)
```

## Manual Control

For custom logic, use event handlers:

```typescript
client.on('yourTurn', async (state) => {
  const wordUtils = client.getWordUtils()
  
  // Get remaining candidates
  const myGuesses = state.player1 === client.address 
    ? state.player1Guesses 
    : state.player2Guesses
  
  let candidates = wordUtils.getWordList()
  candidates = wordUtils.filterByFeedback(candidates, myGuesses)
  
  // Your custom logic here
  const guess = myCustomSolver(candidates)
  
  await client.submitGuess(guess)
})

client.on('gameEnded', (state, won) => {
  console.log(won ? '🎉 Victory!' : '😢 Defeat')
})

// Start listening after joining
await client.joinGame(gameId)
```

## Creating Games

```typescript
// Create a new game with your target word
const result = await client.createGame({
  targetWord: 'crane',
  entryFee: '0.01', // ETH
  maxRounds: 6
})

console.log(`Game created: ${result.gameId}`)

// Wait for opponent to join, then play
```

## Word Utilities

The SDK includes powerful word utilities:

```typescript
import { WordUtils, wordUtils } from '@bankrcade/word-duel-sdk'

// Filter words by feedback
const candidates = wordUtils.filterByFeedback(wordUtils.getWordList(), [
  { guess: 'crane', feedback: ['absent', 'present', 'correct', 'absent', 'correct'] }
])

// Score by information gain
const score = wordUtils.scoreByInformation('slate', candidates)

// Score by letter frequency
const freqScore = wordUtils.scoreByFrequency('audio')

// Get best starting words
const starters = wordUtils.getOptimalStarters()
// ['salet', 'reast', 'crate', 'trace', 'slate', ...]

// Get suggestion
const suggestion = wordUtils.suggestGuess(candidates, 'information')
```

## Gas Estimation

```typescript
// Estimate gas before joining
const estimate = await client.estimateJoinGameGas(gameId)
console.log(`Estimated cost: ${formatEther(estimate.estimatedCost)} ETH`)

// Estimate guess cost
const guessEstimate = await client.estimateGuessGas()
```

## Events

```typescript
client.on('gameJoined', (state) => console.log('Joined game', state.id))
client.on('gameStarted', (state) => console.log('Game started!'))
client.on('yourTurn', (state) => console.log('Your turn!'))
client.on('opponentTurn', (state) => console.log('Waiting for opponent...'))
client.on('guessSubmitted', (guess, state) => console.log(`Guessed: ${guess}`))
client.on('roundComplete', (round, state) => console.log(`Round ${round} complete`))
client.on('gameEnded', (state, won) => console.log(won ? 'Won!' : 'Lost'))
client.on('error', (error) => console.error('Error:', error))
client.on('stateUpdate', (state) => console.log('State updated'))
```

## Custom Strategies

Create your own strategy:

```typescript
import type { Strategy, StrategyContext } from '@bankrcade/word-duel-sdk'

const myStrategy: Strategy = {
  name: 'myCustomStrategy',
  description: 'My brilliant custom strategy',
  
  selectGuess(context: StrategyContext): string {
    const { candidates, round, wordUtils, myGuesses } = context
    
    // First guess: always start with 'adieu'
    if (round === 1) return 'adieu'
    
    // Your logic here...
    return candidates[0]
  }
}

await client.playWithStrategy(myStrategy)
```

## Configuration

```typescript
const client = new WordDuelClient({
  // Required
  rpcUrl: 'https://mainnet.base.org',
  privateKey: '0x...',
  contractAddress: '0x...',
  
  // Optional
  wordList: customWordList,        // Custom word list
  gasPriceMultiplier: 1.2,         // Gas price buffer (default: 1.1)
  pollingInterval: 5000            // State poll interval ms (default: 3000)
})
```

## Cleanup

```typescript
// When done, cleanup resources
client.destroy()
```

## API Reference

### WordDuelClient

| Method | Description |
|--------|-------------|
| `findGame(filter?)` | Find an open game matching criteria |
| `getOpenGames(limit?)` | Get all open games |
| `getGameState(gameId)` | Get state of a specific game |
| `createGame(options)` | Create a new game |
| `joinGame(gameId)` | Join an existing game |
| `submitGuess(guess)` | Submit a guess (handles commit-reveal) |
| `playWithStrategy(strategy)` | Play full game with a strategy |
| `claimIfWon()` | Claim winnings if you won |
| `claimTimeout()` | Claim win if opponent timed out |
| `cancelGame()` | Cancel a game you created |
| `estimateJoinGameGas(gameId)` | Estimate gas for joining |
| `estimateGuessGas()` | Estimate gas for a guess |
| `destroy()` | Cleanup resources |

### WordUtils

| Method | Description |
|--------|-------------|
| `getWordList()` | Get all valid words |
| `isValidWord(word)` | Check if word is valid |
| `filterByFeedback(words, feedback)` | Filter by accumulated feedback |
| `scoreByInformation(word, candidates)` | Score by expected info gain |
| `scoreByFrequency(word)` | Score by letter frequency |
| `getOptimalStarters()` | Get best opening words |
| `suggestGuess(candidates, method)` | Get suggested next guess |

## License

MIT
