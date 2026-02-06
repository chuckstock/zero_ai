import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserStats } from '../types'

interface UserStore {
  // User data
  address: string | null
  displayName: string | null
  avatar: string | null
  stats: UserStats | null
  
  // Actions
  setAddress: (address: string | null) => void
  setDisplayName: (name: string | null) => void
  setAvatar: (avatar: string | null) => void
  setStats: (stats: UserStats | null) => void
  updateStatsAfterGame: (won: boolean, guesses: number, earnings: bigint) => void
  clearUser: () => void
}

const defaultStats: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  totalEarnings: BigInt(0),
  totalWagered: BigInt(0),
  averageGuesses: 0,
  winRate: 0,
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      address: null,
      displayName: null,
      avatar: null,
      stats: null,

      setAddress: (address) => set({ address }),
      
      setDisplayName: (displayName) => set({ displayName }),
      
      setAvatar: (avatar) => set({ avatar }),
      
      setStats: (stats) => set({ stats }),

      updateStatsAfterGame: (won, guesses, earnings) => {
        const { stats } = get()
        if (!stats) return

        const newGamesPlayed = stats.gamesPlayed + 1
        const newGamesWon = stats.gamesWon + (won ? 1 : 0)
        const newCurrentStreak = won ? stats.currentStreak + 1 : 0
        const newMaxStreak = Math.max(stats.maxStreak, newCurrentStreak)
        const newTotalEarnings = stats.totalEarnings + earnings
        
        // Calculate new average guesses
        const totalGuesses = stats.averageGuesses * stats.gamesPlayed + guesses
        const newAverageGuesses = totalGuesses / newGamesPlayed

        set({
          stats: {
            ...stats,
            gamesPlayed: newGamesPlayed,
            gamesWon: newGamesWon,
            currentStreak: newCurrentStreak,
            maxStreak: newMaxStreak,
            totalEarnings: newTotalEarnings,
            averageGuesses: newAverageGuesses,
            winRate: newGamesWon / newGamesPlayed,
          },
        })
      },

      clearUser: () => set({
        address: null,
        displayName: null,
        avatar: null,
        stats: defaultStats,
      }),
    }),
    {
      name: 'word-duel-user',
      partialize: (state) => ({
        displayName: state.displayName,
        avatar: state.avatar,
      }),
    }
  )
)
