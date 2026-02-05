import { create } from 'zustand'
import { Toast } from '../types'
import { generateId } from '../utils/helpers'

interface ToastStore {
  toasts: Toast[]
  
  addToast: (message: string, type?: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const id = generateId()
    const toast: Toast = { id, message, type, duration }
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }))

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  clearToasts: () => set({ toasts: [] }),
}))
