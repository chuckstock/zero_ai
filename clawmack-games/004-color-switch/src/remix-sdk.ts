import FarcadeSDK from '@farcade/game-sdk';

class RemixSDK {
  private initialized = false;
  private playAgainCallback: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await FarcadeSDK.init();
      this.initialized = true;
      console.log('[RemixSDK] Initialized successfully');
    } catch (error) {
      console.warn('[RemixSDK] Init failed, running in standalone mode:', error);
      this.initialized = true;
    }
  }

  gameOver(score: number): void {
    console.log('[RemixSDK] Game Over - Score:', score);
    
    try {
      FarcadeSDK.gameOver({ score });
    } catch (error) {
      console.warn('[RemixSDK] gameOver failed:', error);
    }
  }

  haptic(): void {
    try {
      FarcadeSDK.haptic();
    } catch {
      // Silently fail for haptics
    }
  }

  onPlayAgain(callback: () => void): void {
    this.playAgainCallback = callback;
    
    try {
      FarcadeSDK.on('playAgain', () => {
        console.log('[RemixSDK] Play Again triggered');
        if (this.playAgainCallback) {
          this.playAgainCallback();
        }
      });
    } catch (error) {
      console.warn('[RemixSDK] onPlayAgain registration failed:', error);
    }
  }
}

export const remix = new RemixSDK();
