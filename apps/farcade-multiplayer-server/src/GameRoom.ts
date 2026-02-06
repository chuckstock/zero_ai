/**
 * GameRoom Durable Object
 * Manages multiplayer game state and WebSocket connections for a single room
 */

// Player state
interface PlayerState {
  id: string;
  x: number;
  y: number;
  color: string;
  name?: string;
  joinedAt: number;
}

// Game state stored in the Durable Object
interface GameState {
  players: Record<string, PlayerState>;
  createdAt: number;
  lastActivity: number;
}

// Incoming message types
type ClientMessage =
  | { type: 'join'; name?: string }
  | { type: 'move'; x: number; y: number }
  | { type: 'action'; action: string; data?: unknown };

// Outgoing message types
type ServerMessage =
  | { type: 'welcome'; playerId: string; state: GameState }
  | { type: 'player_joined'; player: PlayerState }
  | { type: 'player_left'; playerId: string }
  | { type: 'move'; playerId: string; x: number; y: number }
  | { type: 'action'; playerId: string; action: string; data?: unknown }
  | { type: 'sync'; state: GameState }
  | { type: 'error'; message: string };

// Random color palette for players
const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF7F50',
];

// Generate unique player ID
function generatePlayerId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// Get random color
function getRandomColor(): string {
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private players: Map<string, WebSocket> = new Map();
  private playerStates: Map<string, PlayerState> = new Map();
  private createdAt: number = Date.now();

  constructor(state: DurableObjectState) {
    this.state = state;

    // Restore state from storage on construction
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<GameState>('gameState');
      if (stored) {
        this.createdAt = stored.createdAt;
        // Note: players map is rebuilt from active connections
        // Stored player states are cleared on restart (connections are lost)
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Only handle WebSocket upgrades
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    this.handleWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleWebSocket(ws: WebSocket): void {
    // Accept the connection
    ws.accept();

    let playerId: string | null = null;

    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string) as ClientMessage;

        switch (message.type) {
          case 'join':
            playerId = await this.handleJoin(ws, message.name);
            break;

          case 'move':
            if (playerId) {
              await this.handleMove(playerId, message.x, message.y);
            } else {
              this.sendToSocket(ws, { type: 'error', message: 'Must join first' });
            }
            break;

          case 'action':
            if (playerId) {
              this.handleAction(playerId, message.action, message.data);
            } else {
              this.sendToSocket(ws, { type: 'error', message: 'Must join first' });
            }
            break;

          default:
            this.sendToSocket(ws, { type: 'error', message: 'Unknown message type' });
        }
      } catch (error) {
        console.error('Message handling error:', error);
        this.sendToSocket(ws, { type: 'error', message: 'Invalid message format' });
      }
    });

    ws.addEventListener('close', () => {
      if (playerId) {
        this.handleDisconnect(playerId);
      }
    });

    ws.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      if (playerId) {
        this.handleDisconnect(playerId);
      }
    });
  }

  private async handleJoin(ws: WebSocket, name?: string): Promise<string> {
    const playerId = generatePlayerId();

    // Create player state
    const playerState: PlayerState = {
      id: playerId,
      x: Math.random() * 800,  // Random spawn position
      y: Math.random() * 600,
      color: getRandomColor(),
      name: name || `Player ${this.players.size + 1}`,
      joinedAt: Date.now(),
    };

    // Register the player
    this.players.set(playerId, ws);
    this.playerStates.set(playerId, playerState);

    // Save state
    await this.saveState();

    // Send welcome message with current state
    const gameState = this.getGameState();
    this.sendToSocket(ws, {
      type: 'welcome',
      playerId,
      state: gameState,
    });

    // Broadcast to other players
    this.broadcastExcept(playerId, {
      type: 'player_joined',
      player: playerState,
    });

    console.log(`Player ${playerId} joined. Total players: ${this.players.size}`);
    return playerId;
  }

  private async handleMove(playerId: string, x: number, y: number): Promise<void> {
    const playerState = this.playerStates.get(playerId);
    if (!playerState) return;

    // Validate coordinates (basic bounds checking)
    const clampedX = Math.max(0, Math.min(10000, x));
    const clampedY = Math.max(0, Math.min(10000, y));

    // Update player position
    playerState.x = clampedX;
    playerState.y = clampedY;

    // Broadcast movement to all other players
    this.broadcastExcept(playerId, {
      type: 'move',
      playerId,
      x: clampedX,
      y: clampedY,
    });

    // Periodically save state (not on every move for performance)
    if (Math.random() < 0.1) {
      await this.saveState();
    }
  }

  private handleAction(playerId: string, action: string, data?: unknown): void {
    // Broadcast generic action to all other players
    this.broadcastExcept(playerId, {
      type: 'action',
      playerId,
      action,
      data,
    });
  }

  private async handleDisconnect(playerId: string): Promise<void> {
    // Clean up player
    this.players.delete(playerId);
    this.playerStates.delete(playerId);

    // Broadcast departure
    this.broadcast({
      type: 'player_left',
      playerId,
    });

    // Save state
    await this.saveState();

    console.log(`Player ${playerId} left. Total players: ${this.players.size}`);
  }

  private getGameState(): GameState {
    const players: Record<string, PlayerState> = {};
    for (const [id, state] of this.playerStates) {
      players[id] = state;
    }

    return {
      players,
      createdAt: this.createdAt,
      lastActivity: Date.now(),
    };
  }

  private async saveState(): Promise<void> {
    const gameState = this.getGameState();
    await this.state.storage.put('gameState', gameState);
  }

  private sendToSocket(ws: WebSocket, message: ServerMessage): void {
    try {
      if (ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Send error:', error);
    }
  }

  private broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const [, ws] of this.players) {
      try {
        if (ws.readyState === WebSocket.READY_STATE_OPEN) {
          ws.send(data);
        }
      } catch (error) {
        console.error('Broadcast error:', error);
      }
    }
  }

  private broadcastExcept(excludePlayerId: string, message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const [playerId, ws] of this.players) {
      if (playerId === excludePlayerId) continue;
      try {
        if (ws.readyState === WebSocket.READY_STATE_OPEN) {
          ws.send(data);
        }
      } catch (error) {
        console.error('Broadcast error:', error);
      }
    }
  }
}
