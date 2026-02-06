/**
 * RemixSDK Wrapper
 * Provides a clean interface to @farcade/game-sdk
 */
import FarcadeSDK from '@farcade/game-sdk'

class RemixSDK {
  private sdk: typeof FarcadeSDK
  private initialized: boolean = false
  private playAgainCallback: (() => void) | null = null

  constructor() {
    this.sdk = FarcadeSDK
  }

  /**
   * Initialize the SDK - call this at game start
   */
  async init(): Promise<void> {
    if (this.initialized) return
    
    try {
      await this.sdk.init()
      this.initialized = true
      
      // Listen for play again events
      this.sdk.on('playAgain', () => {
        if (this.playAgainCallback) {
          this.playAgainCallback()
        }
      })
    } catch (error) {
      console.warn('RemixSDK init failed (running outside Remix?):', error)
      this.initialized = true // Allow game to continue
    }
  }

  /**
   * Report game over with final score
   */
  gameOver(score: number): void {
    if (!this.initialized) {
      console.warn('RemixSDK not initialized')
      return
    }
    
    try {
      this.sdk.gameOver({ score })
    } catch (error) {
      console.warn('RemixSDK gameOver failed:', error)
    }
  }

  /**
   * Trigger haptic feedback
   */
  haptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    try {
      this.sdk.haptic({ type })
    } catch (error) {
      // Haptic might not be available on all devices
    }
  }

  /**
   * Register callback for when player wants to play again
   */
  onPlayAgain(callback: () => void): void {
    this.playAgainCallback = callback
  }
}

export const remix = new RemixSDK()
