import FarcadeSDK from '@farcade/game-sdk'

class RemixSDK {
  private initialized = false
  private playAgainCallback: (() => void) | null = null

  async init(): Promise<void> {
    if (this.initialized) return
    
    try {
      await FarcadeSDK.init()
      this.initialized = true
      console.log('Remix SDK initialized')
    } catch (error) {
      console.warn('Remix SDK init failed, running standalone:', error)
    }
  }

  gameOver(score: number): void {
    if (!this.initialized) {
      console.log('Game Over! Score:', score)
      return
    }
    
    try {
      FarcadeSDK.actions.gameOver({ score })
    } catch (error) {
      console.warn('Failed to send game over:', error)
    }
  }

  haptic(): void {
    if (!this.initialized) return
    
    try {
      FarcadeSDK.actions.haptic()
    } catch (error) {
      // Silently fail for haptics
    }
  }

  onPlayAgain(callback: () => void): void {
    this.playAgainCallback = callback
    
    if (!this.initialized) return
    
    try {
      FarcadeSDK.on('playAgain', () => {
        if (this.playAgainCallback) {
          this.playAgainCallback()
        }
      })
    } catch (error) {
      console.warn('Failed to register playAgain handler:', error)
    }
  }

  triggerPlayAgain(): void {
    if (this.playAgainCallback) {
      this.playAgainCallback()
    }
  }
}

export const remix = new RemixSDK()
