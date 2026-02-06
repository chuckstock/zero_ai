# Word Duel SDK

Play Word Duel (on-chain Wordle) via TypeScript/JavaScript. Built for AI agents.

## Installation

```bash
npm install @bankrcade/word-duel-sdk
```

## Quick Usage

### Find and Play a Game

```typescript
import { WordDuelClient, strategies } from '@bankrcade/word-duel-sdk'

const client = new WordDuelClient({
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: '0x...'
})

// Find game with max 0.01 ETH entry
const game = await client.findGame({ maxEntryFee: '0.01' })

if (game) {
  // Join and play with information theory strategy
  await client.joinGame(game.id)
  await client.playWithStrategy(strategies.informationTheory)
  
  // Claim winnings
  await client.claimIfWon()
}

client.destroy()
```

### Create a Game

```typescript
const result = await client.createGame({
  targetWord: 'crane',
  entryFee: '0.005',
  maxRounds: 6
})
console.log(`Created game: ${result.gameId}`)
```

### Manual Control

```typescript
client.on('yourTurn', async (state) => {
  const utils = client.getWordUtils()
  const myGuesses = state.player1 === client.address 
    ? state.player1Guesses 
    : state.player2Guesses
  
  // Filter candidates by previous feedback
  let candidates = utils.getWordList()
  candidates = utils.filterByFeedback(candidates, myGuesses)
  
  // Pick best guess
  const guess = utils.suggestGuess(candidates, 'information')
  await client.submitGuess(guess)
})
```

## Built-in Strategies

| Strategy | Description | Speed | Quality |
|----------|-------------|-------|---------|
| `strategies.random` | Random from candidates | ⚡⚡⚡ | ⭐ |
| `strategies.frequency` | Common letters first | ⚡⚡⚡ | ⭐⭐ |
| `strategies.informationTheory` | Max info gain | ⚡ | ⭐⭐⭐ |
| `strategies.adaptive` | Switches based on state | ⚡⚡ | ⭐⭐⭐ |
| `strategies.hardMode` | Only valid candidates | ⚡⚡ | ⭐⭐⭐ |

## Word Utilities

```typescript
import { wordUtils } from '@bankrcade/word-duel-sdk'

// Best openers
wordUtils.getOptimalStarters()
// → ['salet', 'reast', 'crate', ...]

// Score candidates
wordUtils.scoreByInformation('slate', candidates)
wordUtils.scoreByFrequency('audio')

// Filter by feedback
const remaining = wordUtils.filterByFeedback(words, [
  { guess: 'crane', feedback: ['absent', 'present', 'correct', 'absent', 'correct'] }
])
```

## Events

| Event | Payload | When |
|-------|---------|------|
| `gameJoined` | `GameState` | Joined a game |
| `yourTurn` | `GameState` | Your turn to guess |
| `opponentTurn` | `GameState` | Waiting for opponent |
| `guessSubmitted` | `(guess, GameState)` | Guess sent |
| `roundComplete` | `(round, GameState)` | Round finished |
| `gameEnded` | `(GameState, won)` | Game over |
| `error` | `Error` | Something failed |

## Custom Strategy

```typescript
const myStrategy = {
  name: 'custom',
  description: 'My strategy',
  selectGuess({ candidates, round, wordUtils }) {
    if (round === 1) return 'salet'
    return wordUtils.suggestGuess(candidates, 'information')
  }
}

await client.playWithStrategy(myStrategy)
```

## Example: Continuous Bot

```typescript
async function runBot() {
  const client = new WordDuelClient({ ... })
  
  while (true) {
    try {
      const game = await client.findGame({ maxEntryFee: '0.01' })
      
      if (game) {
        console.log(`Joining game ${game.id}...`)
        await client.joinGame(game.id)
        await client.playWithStrategy(strategies.adaptive)
        await client.claimIfWon()
      }
      
      await sleep(10000) // Wait before next search
    } catch (e) {
      console.error(e)
      await sleep(30000)
    }
  }
}
```

## Key Methods

- `findGame(filter?)` - Find open game
- `joinGame(id)` - Join game
- `createGame({ targetWord, entryFee })` - Create game
- `submitGuess(word)` - Submit guess (handles commit-reveal)
- `playWithStrategy(strategy)` - Auto-play full game
- `claimIfWon()` - Claim prize
- `getWordUtils()` - Get word utilities

## Dependencies

- `viem` - Ethereum interactions
- `eventemitter3` - Event handling

Works in Node.js 18+ and modern browsers.
