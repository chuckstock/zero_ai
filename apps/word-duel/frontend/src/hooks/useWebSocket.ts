import { useEffect, useRef, useCallback, useState } from 'react'
import { WSMessage, WSMessageType, GameState, OpponentBoard, LobbyGame } from '../types'
import { useGameStore } from '../stores/gameStore'
import { useLobbyStore } from '../stores/lobbyStore'
import { useToastStore } from '../stores/toastStore'
import { WS_URL } from '../lib/constants'

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
}

interface UseWebSocketReturn {
  isConnected: boolean
  send: (type: WSMessageType, payload: unknown) => void
  connect: () => void
  disconnect: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)

  // Store actions
  const { setGame, setOpponentBoard, setTimeRemaining, applyGuessResult } = useGameStore()
  const { setGames, addGame, removeGame, setQueuePosition, setQueueSize, setInQueue } = useLobbyStore()
  const { addToast } = useToastStore()

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data)
      
      switch (message.type) {
        case 'game_update':
          setGame(message.payload as GameState)
          break

        case 'game_start':
          const game = message.payload as GameState
          setGame(game)
          addToast('Game started! Good luck! 🎮', 'success')
          break

        case 'game_end':
          setGame(message.payload as GameState)
          break

        case 'opponent_progress':
          setOpponentBoard(message.payload as OpponentBoard)
          break

        case 'turn_update':
          const { timeRemaining, currentTurn } = message.payload as {
            timeRemaining: number
            currentTurn: string
          }
          setTimeRemaining(timeRemaining)
          break

        case 'queue_update':
          const { position, size, status } = message.payload as {
            position: number
            size: number
            status: 'waiting' | 'matched'
          }
          setQueuePosition(position)
          setQueueSize(size)
          if (status === 'matched') {
            setInQueue(false)
            addToast('Match found! 🎯', 'success')
          }
          break

        case 'error':
          const { message: errorMsg } = message.payload as { message: string }
          addToast(errorMsg, 'error')
          break

        case 'pong':
          // Heartbeat response, ignore
          break

        default:
          console.log('Unhandled message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [setGame, setOpponentBoard, setTimeRemaining, setQueuePosition, setQueueSize, setInQueue, addToast])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectCountRef.current = 0
      }

      ws.onmessage = handleMessage

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          console.log(`Reconnecting... attempt ${reconnectCountRef.current}`)
          setTimeout(connect, reconnectInterval)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }, [handleMessage, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const send = useCallback((type: WSMessageType, payload: unknown) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return
    }

    const message: WSMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }

    wsRef.current.send(JSON.stringify(message))
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      send('ping', {})
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected, send])

  return {
    isConnected,
    send,
    connect,
    disconnect,
  }
}
