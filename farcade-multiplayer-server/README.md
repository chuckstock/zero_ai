# Farcade Multiplayer Server

A Cloudflare Workers-based multiplayer game backend using Durable Objects for real-time WebSocket communication.

## Features

- 🚀 **Serverless** - Runs on Cloudflare's edge network globally
- 🔌 **WebSocket** - Real-time bidirectional communication
- 🏠 **Room-based** - Each game room is a Durable Object with isolated state
- 📦 **Persistent** - Game state survives disconnections
- 🌍 **Low latency** - Durable Objects run close to the first player

## Setup

### Prerequisites

- Node.js 18+ installed
- A Cloudflare account (free tier works)

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

### 3. Install Dependencies

```bash
cd farcade-multiplayer-server
npm install
```

### 4. Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

### 5. Deploy to Production

```bash
npm run deploy
# or
wrangler deploy
```

After deployment, note your URL:
```
https://farcade-multiplayer.<your-subdomain>.workers.dev
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "farcade-multiplayer",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `GET /create-room`
Creates a new room and returns the room code.

**Response:**
```json
{
  "roomId": "ABC123",
  "wsUrl": "wss://farcade-multiplayer.example.workers.dev/room/ABC123"
}
```

### `WebSocket /room/:roomId`
Connect to a game room via WebSocket.

## WebSocket Protocol

### Client → Server Messages

#### Join Room
```json
{
  "type": "join",
  "name": "PlayerName"  // optional
}
```

#### Move
```json
{
  "type": "move",
  "x": 100,
  "y": 200
}
```

#### Generic Action
```json
{
  "type": "action",
  "action": "shoot",
  "data": { "direction": "up" }  // optional
}
```

### Server → Client Messages

#### Welcome (on join)
```json
{
  "type": "welcome",
  "playerId": "p_abc123",
  "state": {
    "players": {
      "p_abc123": { "id": "p_abc123", "x": 400, "y": 300, "color": "#FF6B6B", "name": "Player 1" }
    },
    "createdAt": 1704067200000,
    "lastActivity": 1704067200000
  }
}
```

#### Player Joined
```json
{
  "type": "player_joined",
  "player": { "id": "p_def456", "x": 200, "y": 100, "color": "#4ECDC4", "name": "Player 2" }
}
```

#### Player Left
```json
{
  "type": "player_left",
  "playerId": "p_def456"
}
```

#### Move Broadcast
```json
{
  "type": "move",
  "playerId": "p_abc123",
  "x": 150,
  "y": 250
}
```

#### Action Broadcast
```json
{
  "type": "action",
  "playerId": "p_abc123",
  "action": "shoot",
  "data": { "direction": "up" }
}
```

#### Error
```json
{
  "type": "error",
  "message": "Must join first"
}
```

## Example Client Usage

```javascript
// Create a room
const response = await fetch('https://your-worker.workers.dev/create-room');
const { roomId, wsUrl } = await response.json();

// Connect via WebSocket
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  // Join the room
  ws.send(JSON.stringify({ type: 'join', name: 'MyPlayer' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'welcome':
      console.log('Joined as', message.playerId);
      console.log('Current players:', message.state.players);
      break;
    case 'player_joined':
      console.log('New player:', message.player);
      break;
    case 'player_left':
      console.log('Player left:', message.playerId);
      break;
    case 'move':
      console.log(`${message.playerId} moved to (${message.x}, ${message.y})`);
      break;
  }
};

// Send movement
ws.send(JSON.stringify({ type: 'move', x: 100, y: 200 }));

// Send custom action
ws.send(JSON.stringify({ type: 'action', action: 'jump', data: { height: 50 } }));
```

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────┐
│   Client    │────▶│  Cloudflare Worker (src/index.ts)       │
│  (Browser)  │◀────│  - Routes requests                      │
└─────────────┘     │  - Handles CORS                         │
                    │  - Creates/finds Durable Objects        │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │  Durable Object (GameRoom.ts)           │
                    │  - One instance per room                │
                    │  - Manages WebSocket connections        │
                    │  - Stores game state                    │
                    │  - Broadcasts events                    │
                    └─────────────────────────────────────────┘
```

## Cost Considerations

Cloudflare Workers pricing:
- **Workers:** First 100k requests/day free
- **Durable Objects:** $0.15 per million requests, $0.20 per GB-month storage

For a typical game:
- Each room uses one Durable Object
- WebSocket messages count as requests
- Storage is minimal (player positions)

## License

MIT
