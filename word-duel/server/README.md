# Word Duel Game Server

A real-time multiplayer word guessing game server with WebSocket support and smart contract integration.

## Features

- **Real-time gameplay** via WebSocket
- **REST API** for game history and leaderboards
- **Matchmaking queue** for finding opponents
- **Smart contract integration** for on-chain games (optional)
- **SQLite database** for persistence
- **Docker support** for easy deployment

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run database migration
npm run migrate

# Start development server
npm run dev
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t word-duel-server .
docker run -p 3000:3000 -v word-duel-data:/app/data word-duel-server
```

## API Reference

### REST Endpoints

#### `GET /health`
Health check endpoint.

#### `GET /games`
List active games.

```json
{
  "games": [...],
  "count": 10
}
```

#### `POST /games`
Create a new game.

**Body:**
```json
{
  "address": "0x123...",
  "stake": "0"
}
```

#### `GET /games/:id`
Get game details.

#### `GET /leaderboard`
Get top players.

```json
{
  "leaderboard": [
    {
      "address": "0x123...",
      "wins": 10,
      "losses": 5,
      "totalGames": 15,
      "winRate": 0.67,
      "avgTurnsToWin": 4.2,
      "totalStakeWon": "1000000000000000000"
    }
  ],
  "count": 50
}
```

#### `GET /players/:address`
Get player stats.

#### `GET /players/:address/games`
Get player's game history.

#### `GET /matchmaking/stats`
Get matchmaking queue statistics.

### WebSocket Protocol

Connect to `ws://localhost:3000/ws`

#### Client → Server Messages

**Join a game:**
```json
{
  "type": "join_game",
  "payload": {
    "gameId": "uuid",
    "address": "0x123..."
  }
}
```

**Set secret word:**
```json
{
  "type": "set_word",
  "payload": {
    "gameId": "uuid",
    "address": "0x123...",
    "word": "crane",
    "wordHash": "0x..."
  }
}
```

**Commit a guess:**
```json
{
  "type": "commit_guess",
  "payload": {
    "gameId": "uuid",
    "address": "0x123...",
    "guessHash": "0x..."
  }
}
```

**Reveal a guess:**
```json
{
  "type": "reveal_guess",
  "payload": {
    "gameId": "uuid",
    "address": "0x123...",
    "guess": "apple"
  }
}
```

**Join matchmaking:**
```json
{
  "type": "matchmaking_join",
  "payload": {
    "address": "0x123...",
    "stake": "0"
  }
}
```

**Leave matchmaking:**
```json
{
  "type": "matchmaking_leave",
  "payload": {
    "address": "0x123..."
  }
}
```

#### Server → Client Messages

**Game state update:**
```json
{
  "type": "game_state",
  "payload": {
    "id": "uuid",
    "player1": {...},
    "player2": {...},
    "currentTurn": 3,
    "status": "playing",
    ...
  }
}
```

**Turn started:**
```json
{
  "type": "turn_start",
  "payload": {
    "turn": 3,
    "startTime": 1234567890,
    "duration": 120
  }
}
```

**Opponent committed:**
```json
{
  "type": "guess_committed",
  "payload": {
    "address": "0x456..."
  }
}
```

**Guess revealed:**
```json
{
  "type": "guess_revealed",
  "payload": {
    "address": "0x456...",
    "guess": "apple",
    "results": ["gray", "green", "yellow", "gray", "green"],
    "solved": false
  }
}
```

**Game ended:**
```json
{
  "type": "game_end",
  "payload": {
    "winner": "0x123...",
    "player1Word": "crane",
    "player2Word": "apple"
  }
}
```

**Match found:**
```json
{
  "type": "match_found",
  "payload": {
    "gameId": "uuid",
    "opponent": "0x456...",
    "stake": "0"
  }
}
```

**Error:**
```json
{
  "type": "error",
  "payload": {
    "message": "Invalid word"
  }
}
```

## Game Flow

1. **Create/Join Game**
   - Player 1 creates a game via REST API or matchmaking
   - Player 2 joins via WebSocket `join_game` or matchmaking

2. **Set Secret Words**
   - Both players set their 5-letter secret words
   - Words are validated against the word list

3. **Gameplay Loop** (up to 6 turns)
   - Both players commit their guesses
   - Both players reveal their guesses
   - Server computes results (green/yellow/gray)
   - Turn advances or game ends

4. **Game End**
   - First to guess opponent's word wins
   - If both solve same turn, fewer turns wins
   - If neither solves in 6 turns, it's a draw
   - Timeout = automatic forfeit

## Letter Colors

- **Green**: Letter is correct and in the right position
- **Yellow**: Letter is in the word but wrong position
- **Gray**: Letter is not in the word

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| HOST | 0.0.0.0 | Server host |
| DB_PATH | ./data/word-duel.db | SQLite database path |
| TURN_DURATION | 120 | Seconds per turn |
| MATCHMAKING_TIMEOUT | 300000 | Matchmaking queue timeout (ms) |
| RPC_URL | - | Ethereum RPC URL |
| CONTRACT_ADDRESS | - | Word Duel contract address |

## License

MIT
