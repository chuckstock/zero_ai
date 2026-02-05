import { create } from 'zustand'
import { LobbyGame } from '../types'

interface LobbyStore {
  // Lobby state
  games: LobbyGame[]
  inQueue: boolean
  queueWager: string
  queuePosition: number
  queueSize: number
  
  // Creating game
  isCreating: boolean
  selectedWager: string
  
  // Actions
  setGames: (games: LobbyGame[]) => void
  addGame: (game: LobbyGame) => void
  removeGame: (gameId: string) => void
  updateGame: (gameId: string, updates: Partial<LobbyGame>) => void
  
  setInQueue: (inQueue: boolean) => void
  setQueueWager: (wager: string) => void
  setQueuePosition: (position: number) => void
  setQueueSize: (size: number) => void
  
  setIsCreating: (creating: boolean) => void
  setSelectedWager: (wager: string) => void
  
  resetLobby: () => void
}

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  // Initial state
  games: [],
  inQueue: false,
  queueWager: '0.01',
  queuePosition: 0,
  queueSize: 0,
  isCreating: false,
  selectedWager: '0.01',

  setGames: (games) => set({ games }),

  addGame: (game) => set((state) => ({
    games: [...state.games, game],
  })),

  removeGame: (gameId) => set((state) => ({
    games: state.games.filter((g) => g.id !== gameId),
  })),

  updateGame: (gameId, updates) => set((state) => ({
    games: state.games.map((g) =>
      g.id === gameId ? { ...g, ...updates } : g
    ),
  })),

  setInQueue: (inQueue) => set({ inQueue }),
  
  setQueueWager: (queueWager) => set({ queueWager }),
  
  setQueuePosition: (queuePosition) => set({ queuePosition }),
  
  setQueueSize: (queueSize) => set({ queueSize }),

  setIsCreating: (isCreating) => set({ isCreating }),
  
  setSelectedWager: (selectedWager) => set({ selectedWager }),

  resetLobby: () => set({
    games: [],
    inQueue: false,
    queueWager: '0.01',
    queuePosition: 0,
    queueSize: 0,
    isCreating: false,
    selectedWager: '0.01',
  }),
}))
