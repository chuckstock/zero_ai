import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  soundEnabled: boolean
  musicEnabled: boolean
  hardMode: boolean
  highContrast: boolean
  
  toggleSound: () => void
  toggleMusic: () => void
  toggleHardMode: () => void
  toggleHighContrast: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: false,
      hardMode: false,
      highContrast: false,

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      toggleHardMode: () => set((state) => ({ hardMode: !state.hardMode })),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
    }),
    {
      name: 'word-duel-settings',
    }
  )
)
