// Multiplayer WebSocket Client SDK
// Configure your WebSocket URL here
const WS_URL = 'wss://farcade-multiplayer.remix-gg.workers.dev'
// For local testing: 'ws://localhost:8787'

export interface PlayerState {
  id: string
  x: number
  y: number
  color: number | string
  name: string
}

type EventCallback = (data: any) => void

export class MultiplayerClient {
  private ws: WebSocket | null = null
  private listeners: Map<string, EventCallback[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  roomId: string = ''
  playerId: string = ''
  players: Map<string, PlayerState> = new Map()
  isConnected: boolean = false

  async connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.roomId = roomId || this.generateRoomCode()
        
        const wsUrl = `${WS_URL}/room/${this.roomId}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log(`[MP] Connected to room: ${this.roomId}`)
          this.isConnected = true
          this.reconnectAttempts = 0
          // Don't emit connected yet - wait for welcome message
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (e) {
            console.error('[MP] Failed to parse message:', e)
          }
        }

        this.ws.onclose = (event) => {
          console.log(`[MP] Disconnected: ${event.code}`)
          this.isConnected = false
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          // Attempt reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => {
              console.log(`[MP] Reconnect attempt ${this.reconnectAttempts}`)
              this.connect(this.roomId).catch(() => {})
            }, 1000 * this.reconnectAttempts)
          }
        }

        this.ws.onerror = (error) => {
          console.error('[MP] WebSocket error:', error)
          this.emit('error', error)
          reject(error)
        }

        // Resolve when we receive welcome message (set up in handleMessage)
        const originalEmit = this.emit.bind(this)
        this.emit = (event: string, data: any) => {
          originalEmit(event, data)
          if (event === 'connected') {
            resolve()
          }
        }

        // Timeout for connection
        setTimeout(() => {
          if (!this.playerId) {
            reject(new Error('Connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: { type: string; [key: string]: any }) {
    const { type, ...rest } = message
    console.log('[MP] Received:', type, rest)

    switch (type) {
      case 'welcome':
        // Server sends welcome with playerId and state
        this.playerId = message.playerId
        this.players.clear()
        if (message.state?.players) {
          for (const [id, player] of Object.entries(message.state.players)) {
            if (id !== this.playerId) {
              this.players.set(id, player as PlayerState)
            }
          }
        }
        console.log(`[MP] Welcomed as ${this.playerId}, ${this.players.size} other players`)
        this.emit('connected', { roomId: this.roomId, playerId: this.playerId })
        this.emit('room_state', { players: Array.from(this.players.values()) })
        break

      case 'player_joined':
        // Server sends { type: 'player_joined', player: PlayerState }
        const joinedPlayer = message.player
        if (joinedPlayer && joinedPlayer.id !== this.playerId) {
          this.players.set(joinedPlayer.id, joinedPlayer)
          this.emit('player_joined', joinedPlayer)
        }
        break

      case 'player_left':
        // Server sends { type: 'player_left', playerId: string }
        const leftId = message.playerId
        this.players.delete(leftId)
        this.emit('player_left', { id: leftId })
        break

      case 'move':
        // Server sends { type: 'move', playerId, x, y }
        const moveId = message.playerId
        if (moveId !== this.playerId) {
          const player = this.players.get(moveId)
          if (player) {
            player.x = message.x
            player.y = message.y
          }
          this.emit('move', { id: moveId, x: message.x, y: message.y })
        }
        break

      case 'error':
        console.error('[MP] Server error:', message.message)
        this.emit('error', { message: message.message })
        break

      default:
        // Pass through any other message types
        this.emit(type, rest)
    }
  }

  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, ...data }
      console.log('[MP] Sending:', message)
      this.ws.send(JSON.stringify(message))
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.players.clear()
    this.roomId = ''
    this.playerId = ''
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  getInviteLink(): string {
    return `${window.location.origin}${window.location.pathname}?room=${this.roomId}`
  }
}

// Singleton instance for easy access
export const multiplayer = new MultiplayerClient()
