import Phaser from 'phaser';
import FarcadeSDK from '@farcade/game-sdk';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    // Dark atmospheric background
    this.cameras.main.setBackgroundColor(0x0a0a12);

    // Animated loading text with glow
    const loadingText = this.add.text(width / 2, height / 2 - 40, 'TAP STACK', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const chaosText = this.add.text(width / 2, height / 2 + 20, 'CHAOS', {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff4422',
    }).setOrigin(0.5);

    // Pulsing glow effect
    this.tweens.add({
      targets: [loadingText, chaosText],
      alpha: { from: 0.6, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Element preview circles
    const elements = [
      { x: -60, color: 0xff4422 }, // Fire
      { x: -20, color: 0x2266ff }, // Water
      { x: 20, color: 0x88ddff },  // Ice
      { x: 60, color: 0xffee00 },  // Electric
    ];

    elements.forEach((el, i) => {
      const circle = this.add.circle(width / 2 + el.x, height / 2 + 80, 8, el.color);
      this.tweens.add({
        targets: circle,
        scale: { from: 0.8, to: 1.2 },
        alpha: { from: 0.5, to: 1 },
        duration: 500,
        delay: i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Initialize Farcade SDK
    try {
      await FarcadeSDK.init();
      
      // Wait for SDK ready signal
      FarcadeSDK.onPlayGame(async () => {
        this.cameras.main.fadeOut(300, 10, 10, 18);
        this.time.delayedCall(300, () => {
          this.scene.start('GameScene');
        });
      });
    } catch (error) {
      console.warn('Farcade SDK init failed, starting game directly:', error);
      this.time.delayedCall(1500, () => {
        this.cameras.main.fadeOut(300, 10, 10, 18);
        this.time.delayedCall(300, () => {
          this.scene.start('GameScene');
        });
      });
    }
  }
}
