import { useCallback } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  const fireConfetti = useCallback((options?: confetti.Options) => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#538d4e', '#b59f3b', '#ffffff', '#ffd700'],
    }

    confetti({
      ...defaults,
      ...options,
      particleCount: 50,
      scalar: 1.2,
      shapes: ['star'],
    })

    confetti({
      ...defaults,
      ...options,
      particleCount: 30,
      scalar: 0.75,
      shapes: ['circle'],
    })
  }, [])

  const fireWinConfetti = useCallback(() => {
    // Fire from both sides
    const duration = 3000
    const end = Date.now() + duration

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval)
        return
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#538d4e', '#b59f3b', '#ffd700'],
      })

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#538d4e', '#b59f3b', '#ffd700'],
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const fireLoseConfetti = useCallback(() => {
    // Sad confetti (gray, falling slowly)
    confetti({
      particleCount: 30,
      spread: 100,
      origin: { y: 0.3 },
      colors: ['#3a3a3c', '#818384'],
      gravity: 1.5,
      scalar: 0.8,
    })
  }, [])

  return {
    fireConfetti,
    fireWinConfetti,
    fireLoseConfetti,
  }
}
