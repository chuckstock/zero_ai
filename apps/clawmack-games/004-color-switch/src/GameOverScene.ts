import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_COLORS, CorruptionLevel } from './types';

declare const FarcadeSDK: any;

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private deathReason: string = '';
  private corruption: CorruptionLevel = CorruptionLevel.NONE;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    this.score = this.registry.get('score') || 0;
    this.deathReason = this.registry.get('deathReason') || 'GAME OVER';
    this.corruption = this.registry.get('corruption') || CorruptionLevel.NONE;

    // Background with corruption level
    this.createCorruptedBackground();
    
    // Death reason
    const reasonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, 
      `// ${this.deathReason} //`, {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#ff0000'
    }).setOrigin(0.5);
    
    // Glitch the reason text
    if (this.corruption >= CorruptionLevel.SUBTLE) {
      this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (Math.random() < 0.3) {
            reasonText.setX(GAME_WIDTH / 2 + Phaser.Math.Between(-10, 10));
            reasonText.setAlpha(Math.random() * 0.5 + 0.5);
          } else {
            reasonText.setX(GAME_WIDTH / 2);
            reasonText.setAlpha(1);
          }
        }
      });
    }

    // Score display
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 'SCORE', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, 
      this.score.toString(), {
      fontSize: '72px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Corruption level indicator
    const corruptionNames = ['CLEAN', 'GLITCHING', 'BREAKING', 'CORRUPTED'];
    const corruptionColors = ['#00ff00', '#ffff00', '#ff8800', '#ff0000'];
    
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, 
      `SYSTEM: ${corruptionNames[this.corruption]}`, {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: corruptionColors[this.corruption]
    }).setOrigin(0.5);

    // Stats
    if (this.score >= 10) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.65, 
        '⚠ You witnessed the corruption ⚠', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ff00ff'
      }).setOrigin(0.5);
    }

    // Retry button
    const retryBg = this.add.graphics();
    retryBg.fillStyle(0x00ffff, 0.2);
    retryBg.fillRoundedRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.75 - 25, 200, 50, 10);
    retryBg.lineStyle(2, 0x00ffff, 1);
    retryBg.strokeRoundedRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.75 - 25, 200, 50, 10);

    const retryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'RETRY', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#00ffff'
    }).setOrigin(0.5);

    // Make retry interactive
    const retryZone = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 200, 50)
      .setInteractive();

    retryZone.on('pointerover', () => {
      retryBg.clear();
      retryBg.fillStyle(0x00ffff, 0.4);
      retryBg.fillRoundedRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.75 - 25, 200, 50, 10);
      retryBg.lineStyle(2, 0x00ffff, 1);
      retryBg.strokeRoundedRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.75 - 25, 200, 50, 10);
    });

    retryZone.on('pointerout', () => {
      retryBg.clear();
      retryBg.fillStyle(0x00ffff, 0.2);
      retryBg.fillRoundedRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.75 - 25, 200, 50, 10);
      retryBg.lineStyle(2, 0x00ffff, 1);
      retryBg.strokeRoundedRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.75 - 25, 200, 50, 10);
    });

    retryZone.on('pointerdown', () => {
      this.cameras.main.flash(200, 0, 255, 255);
      this.time.delayedCall(200, () => {
        this.scene.start('GameScene');
      });
    });

    // Also allow tap anywhere after delay
    this.time.delayedCall(1000, () => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.88, 'tap anywhere to restart', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#666666'
      }).setOrigin(0.5);

      this.input.on('pointerdown', () => {
        this.cameras.main.flash(200, 0, 255, 255);
        this.time.delayedCall(200, () => {
          this.scene.start('GameScene');
        });
      });
    });

    // Request play again via SDK
    if (typeof FarcadeSDK !== 'undefined') {
      FarcadeSDK.requestPlayAgain();
    }
  }

  private createCorruptedBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid with corruption
    bg.lineStyle(1, 0x1a1a2f, 0.3);
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      const offset = this.corruption >= CorruptionLevel.BREAKING 
        ? Phaser.Math.Between(-5, 5) : 0;
      bg.lineBetween(offset, y, GAME_WIDTH + offset, y);
    }
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      const offset = this.corruption >= CorruptionLevel.BREAKING 
        ? Phaser.Math.Between(-5, 5) : 0;
      bg.lineBetween(x, offset, x, GAME_HEIGHT + offset);
    }

    // Corruption visual artifacts
    if (this.corruption >= CorruptionLevel.SUBTLE) {
      this.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => {
          if (Math.random() < 0.2 * this.corruption) {
            const glitch = this.add.graphics();
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const height = Phaser.Math.Between(2, 20);
            const color = GAME_COLORS[Phaser.Math.Between(0, 3)].hex;
            
            glitch.fillStyle(color, 0.3);
            glitch.fillRect(0, y, GAME_WIDTH, height);
            
            this.time.delayedCall(50, () => glitch.destroy());
          }
        }
      });
    }

    // Scanlines for full corruption
    if (this.corruption >= CorruptionLevel.FULL) {
      const scanlines = this.add.graphics();
      scanlines.lineStyle(1, 0x000000, 0.3);
      for (let y = 0; y < GAME_HEIGHT; y += 3) {
        scanlines.lineBetween(0, y, GAME_WIDTH, y);
      }
    }
  }
}
