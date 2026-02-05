import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { playSound } from '../utils/helpers'
import { SOUNDS } from '../lib/constants'

interface UseGameTimerOptions {
  onTimeout?: () => void
  warningThreshold?: number
}

export function useGameTimer(options: UseGameTimerOptions = {}) {
  const { onTimeout, warningThreshold = 10 } = options
  
  const { timeRemaining, setTimeRemaining, game } = useGameStore()
  const { soundEnabled } = useSettingsStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickRef = useRef<number>(0)

  const startTimer = useCallback((duration: number) => {
    setTimeRemaining(duration)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(Math.max(0, useGameStore.getState().timeRemaining - 1))
    }, 1000)
  }, [setTimeRemaining])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetTimer = useCallback((duration: number) => {
    stopTimer()
    startTimer(duration)
  }, [stopTimer, startTimer])

  // Play tick sound for last few seconds
  useEffect(() => {
    if (
      soundEnabled &&
      timeRemaining <= warningThreshold &&
      timeRemaining > 0 &&
      timeRemaining !== lastTickRef.current
    ) {
      playSound(SOUNDS.tick, 0.3)
      lastTickRef.current = timeRemaining
    }
  }, [timeRemaining, soundEnabled, warningThreshold])

  // Handle timeout
  useEffect(() => {
    if (timeRemaining === 0 && onTimeout) {
      onTimeout()
    }
  }, [timeRemaining, onTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
    }
  }, [stopTimer])

  return {
    timeRemaining,
    startTimer,
    stopTimer,
    resetTimer,
    isUrgent: timeRemaining <= warningThreshold,
  }
}
