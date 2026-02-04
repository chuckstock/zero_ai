import Phaser from 'phaser';
import FarcadeSDK from '@farcade/game-sdk';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private blocksPlaced: number = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; blocksPlaced: number }): void {
    this.score = data.score || 0;
    this.blocksPlaced = data.blocksPlaced || 0;
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    this.cameras.main.fadeIn(500, 10, 10, 18);

    // Background particles (embers)
    this.createEmberParticles();

    // Game Over title with glitch effect
    const gameOverText = this.add.text(width / 2, height * 0.25, 'TOWER\nCOLLAPSED', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff4422',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5);

    // Glitch animation
    this.tweens.add({
      targets: gameOverText,
      x: { from: width / 2 - 3, to: width / 2 + 3 },
      duration: 50,
      yoyo: true,
      repeat: 5,
    });

    // Score display
    this.add.text(width / 2, height * 0.45, 'SCORE', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#666688',
    }).setOrigin(0.5);

    const scoreText = this.add.text(width / 2, height * 0.52, this.score.toString(), {
      fontSize: '64px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Animate score counting up
    let displayScore = 0;
    this.tweens.addCounter({
      from: 0,
      to: this.score,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        displayScore = Math.floor(tween.getValue());
        scoreText.setText(displayScore.toString());
      },
    });

    // Blocks placed stat
    this.add.text(width / 2, height * 0.62, `${this.blocksPlaced} blocks stacked`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#888899',
    }).setOrigin(0.5);

    // Send score to Farcade
    try {
      await FarcadeSDK.sendScore(this.score);
    } catch (error) {
      console.warn('Failed to send score:', error);
    }

    // Tap to restart prompt
    const restartText = this.add.text(width / 2, height * 0.8, 'TAP TO PLAY AGAIN', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Restart on tap (with delay to prevent accidental taps)
    this.time.delayedCall(800, () => {
      this.input.once('pointerdown', () => {
        this.cameras.main.fadeOut(200, 10, 10, 18);
        this.time.delayedCall(200, () => {
          this.scene.start('GameScene');
        });
      });
    });
  }

  private createEmberParticles(): void {
    const { width, height } = this.scale;
    
    // Create floating ember particles
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height, height + 200);
      const color = Phaser.Math.RND.pick([0xff4422, 0xffee00, 0x2266ff, 0x88ddff]);
      
      const ember = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.6);
      
      this.tweens.add({
        targets: ember,
        y: -50,
        x: x + Phaser.Math.Between(-100, 100),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 2000),
        repeat: -1,
        onRepeat: () => {
          ember.x = Phaser.Math.Between(0, width);
          ember.y = height + 50;
          ember.alpha = 0.6;
        },
      });
    }
  }
}
