import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_COLORS } from './types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Dark corrupted background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Glitchy grid lines
    bg.lineStyle(1, 0x1a1a2f, 0.3);
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      bg.lineBetween(0, y, GAME_WIDTH, y);
    }
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      bg.lineBetween(x, 0, x, GAME_HEIGHT);
    }

    // Title with glitch effect
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, 'COLOR\nSWITCH', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      align: 'center',
      stroke: '#00ffff',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Corrupted subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, '// CORRUPTED //', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#ff00ff'
    }).setOrigin(0.5);

    // Glitch animation on subtitle
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (Math.random() < 0.3) {
          subtitle.setX(GAME_WIDTH / 2 + Phaser.Math.Between(-5, 5));
          subtitle.setAlpha(Math.random() * 0.5 + 0.5);
        } else {
          subtitle.setX(GAME_WIDTH / 2);
          subtitle.setAlpha(1);
        }
      }
    });

    // Color ring preview
    this.drawColorRing(GAME_WIDTH / 2, GAME_HEIGHT * 0.55, 60);

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, 
      'TAP to jump\nMatch colors to pass\nHit stars before you FADE', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#888888',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Warning text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, 
      '⚠ CORRUPTION INCREASES WITH SCORE ⚠', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ff4444'
    }).setOrigin(0.5);

    // Start prompt
    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.9, 'TAP TO START', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Start game on tap
    this.input.once('pointerdown', () => {
      this.cameras.main.flash(200, 0, 255, 255);
      this.time.delayedCall(200, () => {
        this.scene.start('GameScene');
      });
    });
  }

  private drawColorRing(x: number, y: number, radius: number): void {
    const graphics = this.add.graphics();
    const segmentAngle = Math.PI / 2;
    const lineWidth = 12;

    for (let i = 0; i < 4; i++) {
      const startAngle = i * segmentAngle - Math.PI / 2;
      const color = GAME_COLORS[i].hex;
      
      graphics.lineStyle(lineWidth, color, 1);
      graphics.beginPath();
      graphics.arc(x, y, radius, startAngle, startAngle + segmentAngle, false);
      graphics.strokePath();
    }

    // Animate rotation
    this.tweens.add({
      targets: graphics,
      angle: 360,
      duration: 4000,
      repeat: -1
    });
  }
}
