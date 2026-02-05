import { useCallback, useRef } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { SOUNDS } from '../lib/constants'

type SoundType = keyof typeof SOUNDS

export function useSound() {
  const { soundEnabled } = useSettingsStore()
  const audioCache = useRef<Record<string, HTMLAudioElement>>({})

  const play = useCallback((sound: SoundType, volume = 0.5) => {
    if (!soundEnabled) return

    try {
      let audio = audioCache.current[sound]
      
      if (!audio) {
        audio = new Audio(SOUNDS[sound])
        audioCache.current[sound] = audio
      }

      audio.volume = volume
      audio.currentTime = 0
      audio.play().catch(() => {
        // Ignore errors (user hasn't interacted yet)
      })
    } catch (error) {
      // Ignore errors
    }
  }, [soundEnabled])

  const playCorrect = useCallback(() => play('correct'), [play])
  const playPresent = useCallback(() => play('present'), [play])
  const playAbsent = useCallback(() => play('absent'), [play])
  const playWin = useCallback(() => play('win', 0.7), [play])
  const playLose = useCallback(() => play('lose', 0.5), [play])
  const playTick = useCallback(() => play('tick', 0.3), [play])
  const playSubmit = useCallback(() => play('submit', 0.4), [play])
  const playInvalid = useCallback(() => play('invalid', 0.4), [play])

  return {
    play,
    playCorrect,
    playPresent,
    playAbsent,
    playWin,
    playLose,
    playTick,
    playSubmit,
    playInvalid,
  }
}
