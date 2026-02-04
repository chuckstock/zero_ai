// Multiplayer WebSocket Client SDK
// Configure your WebSocket URL here
const WS_URL = 'wss://farcade-multiplayer.remix-gg.workers.dev'
// For local testing: 'ws://localhost:8787'

export interface PlayerState {
  id: string
  x: number
  y: number
  color: number
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
        // Generate unique player ID
        this.playerId = this.generateId()
        this.roomId = roomId || this.generateRoomCode()
        
        const wsUrl = `${WS_URL}/room/${this.roomId}?playerId=${this.playerId}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log(`[MP] Connected to room: ${this.roomId}`)
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected', { roomId: this.roomId, playerId: this.playerId })
          resolve()
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

        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: { type: string; data: any }) {
    const { type, data } = message

    switch (type) {
      case 'room_state':
        // Full state sync on join
        this.players.clear()
        if (data.players) {
          for (const player of data.players) {
            if (player.id !== this.playerId) {
              this.players.set(player.id, player)
            }
          }
        }
        this.emit('room_state', data)
        break

      case 'player_joined':
        if (data.id !== this.playerId) {
          this.players.set(data.id, data)
          this.emit('player_joined', data)
        }
        break

      case 'player_left':
        this.players.delete(data.id)
        this.emit('player_left', data)
        break

      case 'move':
        if (data.id !== this.playerId) {
          const player = this.players.get(data.id)
          if (player) {
            player.x = data.x
            player.y = data.y
          }
          this.emit('move', data)
        }
        break

      default:
        // Pass through any other message types
        this.emit(type, data)
    }
  }

  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type,
        data: {
          ...data,
          id: this.playerId
        }
      }))
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
  }

  private generateId(): string {
    return 'p_' + Math.random().toString(36).substring(2, 10)
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
