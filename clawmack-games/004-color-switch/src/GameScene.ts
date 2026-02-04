import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, GAME_COLORS, GRAY_COLOR,
  BALL_RADIUS, GRAVITY, JUMP_VELOCITY,
  COLOR_DECAY_RATE, COLOR_REFRESH_AMOUNT,
  BEAT_INTERVAL, BEAT_WINDOW,
  CorruptionLevel, Obstacle, ColorStar, ColorDef
} from './types';

declare const FarcadeSDK: any;

export class GameScene extends Phaser.Scene {
  // Ball properties
  private ball!: Phaser.GameObjects.Graphics;
  private ballY: number = GAME_HEIGHT * 0.7;
  private ballVelocity: number = 0;
  private ballColorIndex: number = 0;
  private colorFreshness: number = 1.0; // 1.0 = fresh, 0 = gray (dead)
  
  // Game state
  private score: number = 0;
  private isPlaying: boolean = false;
  private isInvincible: boolean = false;
  
  // Obstacles and stars
  private obstacles: Obstacle[] = [];
  private colorStars: ColorStar[] = [];
  private nextObstacleY: number = 0;
  private cameraY: number = 0;
  
  // Beat system
  private beatStartTime: number = 0;
  private lastBeatTime: number = 0;
  private beatIndicator!: Phaser.GameObjects.Graphics;
  
  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private freshnessBar!: Phaser.GameObjects.Graphics;
  private corruptionOverlay!: Phaser.GameObjects.Graphics;
  private scanlines!: Phaser.GameObjects.Graphics;
  
  // Corruption state
  private glitchTimer: number = 0;
  private colorLieTimer: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize SDK
    if (typeof FarcadeSDK !== 'undefined') {
      FarcadeSDK.init();
    }

    // Reset state
    this.score = 0;
    this.ballY = GAME_HEIGHT * 0.7;
    this.ballVelocity = 0;
    this.ballColorIndex = Phaser.Math.Between(0, 3);
    this.colorFreshness = 1.0;
    this.isPlaying = false;
    this.isInvincible = false;
    this.obstacles = [];
    this.colorStars = [];
    this.cameraY = 0;
    this.nextObstacleY = GAME_HEIGHT * 0.4;
    this.beatStartTime = this.time.now;
    
    this.createBackground();
    this.createBall();
    this.createUI();
    this.createCorruptionEffects();
    
    // Spawn initial obstacles
    for (let i = 0; i < 5; i++) {
      this.spawnObstacle();
    }
    
    // Input
    this.input.on('pointerdown', this.onTap, this);
    
    // Start prompt
    this.showStartPrompt();
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setScrollFactor(0);
    
    // Grid pattern
    bg.lineStyle(1, 0x1a1a2f, 0.2);
    for (let y = 0; y < GAME_HEIGHT; y += 30) {
      bg.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  private createBall(): void {
    this.ball = this.add.graphics();
    this.drawBall();
  }

  private drawBall(): void {
    this.ball.clear();
    
    // Get current color with freshness fade
    const baseColor = GAME_COLORS[this.ballColorIndex];
    const fadedColor = this.lerpColor(baseColor, GRAY_COLOR, 1 - this.colorFreshness);
    
    // Outer glow
    const glowAlpha = 0.3 * this.colorFreshness;
    this.ball.fillStyle(fadedColor.hex, glowAlpha);
    this.ball.fillCircle(GAME_WIDTH / 2, this.ballY, BALL_RADIUS + 8);
    
    // Main ball
    this.ball.fillStyle(fadedColor.hex, 1);
    this.ball.fillCircle(GAME_WIDTH / 2, this.ballY, BALL_RADIUS);
    
    // Invincibility flash
    if (this.isInvincible) {
      this.ball.lineStyle(3, 0xffffff, 0.8);
      this.ball.strokeCircle(GAME_WIDTH / 2, this.ballY, BALL_RADIUS + 4);
    }
    
    // Inner highlight
    this.ball.fillStyle(0xffffff, 0.3);
    this.ball.fillCircle(GAME_WIDTH / 2 - 4, this.ballY - 4, BALL_RADIUS * 0.3);
  }

  private lerpColor(color1: ColorDef, color2: ColorDef, t: number): ColorDef {
    const r = Math.round(color1.rgb.r + (color2.rgb.r - color1.rgb.r) * t);
    const g = Math.round(color1.rgb.g + (color2.rgb.g - color1.rgb.g) * t);
    const b = Math.round(color1.rgb.b + (color2.rgb.b - color1.rgb.b) * t);
    return {
      name: 'lerped',
      hex: (r << 16) | (g << 8) | b,
      rgb: { r, g, b }
    };
  }

  private createUI(): void {
    // Score
    this.scoreText = this.add.text(GAME_WIDTH / 2, 60, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    
    // Freshness bar (color decay indicator)
    this.freshnessBar = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.drawFreshnessBar();
    
    // Beat indicator
    this.beatIndicator = this.add.graphics().setScrollFactor(0).setDepth(100);
  }

  private drawFreshnessBar(): void {
    this.freshnessBar.clear();
    
    const barWidth = 200;
    const barHeight = 8;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = 100;
    
    // Background
    this.freshnessBar.fillStyle(0x333333, 0.8);
    this.freshnessBar.fillRoundedRect(x, y, barWidth, barHeight, 4);
    
    // Fill based on freshness
    const fillColor = this.colorFreshness > 0.3 ? GAME_COLORS[this.ballColorIndex].hex : 0xff0000;
    const fillWidth = barWidth * this.colorFreshness;
    this.freshnessBar.fillStyle(fillColor, 1);
    this.freshnessBar.fillRoundedRect(x, y, fillWidth, barHeight, 4);
    
    // Warning flash when low
    if (this.colorFreshness < 0.3 && Math.floor(this.time.now / 200) % 2 === 0) {
      this.freshnessBar.lineStyle(2, 0xff0000, 1);
      this.freshnessBar.strokeRoundedRect(x - 2, y - 2, barWidth + 4, barHeight + 4, 5);
    }
  }

  private createCorruptionEffects(): void {
    // Corruption overlay for glitch effects
    this.corruptionOverlay = this.add.graphics().setScrollFactor(0).setDepth(200);
    
    // Scanlines
    this.scanlines = this.add.graphics().setScrollFactor(0).setDepth(201);
    this.drawScanlines(0);
  }

  private drawScanlines(intensity: number): void {
    this.scanlines.clear();
    if (intensity <= 0) return;
    
    this.scanlines.lineStyle(1, 0x000000, intensity * 0.3);
    for (let y = 0; y < GAME_HEIGHT; y += 3) {
      this.scanlines.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  private showStartPrompt(): void {
    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, 'TAP TO START', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    this.input.once('pointerdown', () => {
      prompt.destroy();
      this.startGame();
    });
  }

  private startGame(): void {
    this.isPlaying = true;
    this.beatStartTime = this.time.now;
  }

  private onTap(): void {
    if (!this.isPlaying) return;
    
    // Jump
    this.ballVelocity = JUMP_VELOCITY;
    
    // Check if on beat
    const timeSinceBeat = (this.time.now - this.beatStartTime) % BEAT_INTERVAL;
    const isOnBeat = timeSinceBeat < BEAT_WINDOW || timeSinceBeat > BEAT_INTERVAL - BEAT_WINDOW;
    
    if (isOnBeat) {
      this.onBeatJump();
    }
  }

  private onBeatJump(): void {
    // Visual feedback
    this.cameras.main.flash(100, 255, 255, 255, false);
    
    // Brief invincibility
    this.isInvincible = true;
    this.time.delayedCall(200, () => {
      this.isInvincible = false;
    });
    
    // Bonus point for beat timing
    this.addScore(1);
    
    // Beat indicator pulse
    this.beatIndicator.clear();
    this.beatIndicator.fillStyle(0xffffff, 0.5);
    this.beatIndicator.fillCircle(GAME_WIDTH / 2, 140, 10);
    this.tweens.add({
      targets: this.beatIndicator,
      alpha: 0,
      duration: 300,
      onComplete: () => this.beatIndicator.setAlpha(1)
    });
  }

  private spawnObstacle(): void {
    const obstacleTypes = ['ring', 'cross', 'bars'];
    const type = obstacleTypes[Phaser.Math.Between(0, obstacleTypes.length - 1)] as 'ring' | 'cross' | 'bars';
    
    const obstacle = this.createObstacle(type, this.nextObstacleY);
    this.obstacles.push(obstacle);
    
    // Spawn color star between obstacles
    this.spawnColorStar(this.nextObstacleY + 100);
    
    this.nextObstacleY -= 300;
  }

  private createObstacle(type: 'ring' | 'cross' | 'bars', y: number): Obstacle {
    const container = this.add.container(GAME_WIDTH / 2, y);
    const segments: any[] = [];
    
    const corruption = this.getCorruptionLevel();
    const rotationSpeed = (0.5 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1);
    
    if (type === 'ring') {
      this.createRingObstacle(container, segments, corruption);
    } else if (type === 'cross') {
      this.createCrossObstacle(container, segments, corruption);
    } else {
      this.createBarsObstacle(container, segments, corruption);
    }
    
    return { container, segments, type, y, rotationSpeed, passed: false };
  }

  private createRingObstacle(container: Phaser.GameObjects.Container, segments: any[], corruption: CorruptionLevel): void {
    const radius = 80;
    const lineWidth = 20;
    const segmentAngle = Math.PI / 2;
    
    for (let i = 0; i < 4; i++) {
      const graphics = this.add.graphics();
      const colorIndex = i;
      const displayColorIndex = this.shouldLieAboutColor(corruption) ? (i + Phaser.Math.Between(1, 3)) % 4 : i;
      const color = GAME_COLORS[displayColorIndex].hex;
      
      graphics.lineStyle(lineWidth, color, 1);
      graphics.beginPath();
      
      const startAngle = i * segmentAngle - Math.PI / 2;
      graphics.arc(0, 0, radius, startAngle, startAngle + segmentAngle - 0.05, false);
      graphics.strokePath();
      
      // Corruption visual artifacts
      if (corruption >= CorruptionLevel.BREAKING) {
        this.addCorruptionArtifacts(graphics, corruption);
      }
      
      container.add(graphics);
      segments.push({
        graphics,
        colorIndex,
        displayColorIndex,
        startAngle,
        endAngle: startAngle + segmentAngle,
        isCorrupted: displayColorIndex !== colorIndex
      });
    }
  }

  private createCrossObstacle(container: Phaser.GameObjects.Container, segments: any[], corruption: CorruptionLevel): void {
    const armLength = 100;
    const armWidth = 25;
    
    for (let i = 0; i < 4; i++) {
      const graphics = this.add.graphics();
      const colorIndex = i;
      const displayColorIndex = this.shouldLieAboutColor(corruption) ? (i + Phaser.Math.Between(1, 3)) % 4 : i;
      const color = GAME_COLORS[displayColorIndex].hex;
      
      graphics.fillStyle(color, 1);
      
      const angle = i * Math.PI / 2;
      const x1 = Math.cos(angle) * 30;
      const y1 = Math.sin(angle) * 30;
      const x2 = Math.cos(angle) * armLength;
      const y2 = Math.sin(angle) * armLength;
      
      // Draw arm as thick line
      graphics.lineStyle(armWidth, color, 1);
      graphics.lineBetween(x1, y1, x2, y2);
      
      if (corruption >= CorruptionLevel.BREAKING) {
        this.addCorruptionArtifacts(graphics, corruption);
      }
      
      container.add(graphics);
      segments.push({
        graphics,
        colorIndex,
        displayColorIndex,
        startAngle: angle - Math.PI / 4,
        endAngle: angle + Math.PI / 4,
        isCorrupted: displayColorIndex !== colorIndex
      });
    }
  }

  private createBarsObstacle(container: Phaser.GameObjects.Container, segments: any[], corruption: CorruptionLevel): void {
    const barWidth = GAME_WIDTH / 4 - 10;
    const barHeight = 30;
    
    for (let i = 0; i < 4; i++) {
      const graphics = this.add.graphics();
      const colorIndex = i;
      const displayColorIndex = this.shouldLieAboutColor(corruption) ? (i + Phaser.Math.Between(1, 3)) % 4 : i;
      const color = GAME_COLORS[displayColorIndex].hex;
      
      const x = -GAME_WIDTH / 2 + i * (barWidth + 10) + 5;
      
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(x, -barHeight / 2, barWidth, barHeight, 5);
      
      if (corruption >= CorruptionLevel.BREAKING) {
        this.addCorruptionArtifacts(graphics, corruption);
      }
      
      container.add(graphics);
      segments.push({
        graphics,
        colorIndex,
        displayColorIndex,
        startAngle: 0,
        endAngle: Math.PI * 2,
        isCorrupted: displayColorIndex !== colorIndex
      });
    }
  }

  private addCorruptionArtifacts(graphics: Phaser.GameObjects.Graphics, corruption: CorruptionLevel): void {
    if (corruption >= CorruptionLevel.FULL) {
      // Random color bleeding
      const bleedColor = GAME_COLORS[Phaser.Math.Between(0, 3)].hex;
      graphics.lineStyle(2, bleedColor, 0.5);
      graphics.lineBetween(
        Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(-20, 20)
      );
    }
    
    if (corruption >= CorruptionLevel.BREAKING && Math.random() < 0.3) {
      // Pixel artifacts
      graphics.fillStyle(0xffffff, 0.3);
      for (let j = 0; j < 3; j++) {
        graphics.fillRect(
          Phaser.Math.Between(-30, 30),
          Phaser.Math.Between(-30, 30),
          Phaser.Math.Between(2, 8),
          Phaser.Math.Between(2, 8)
        );
      }
    }
  }

  private shouldLieAboutColor(corruption: CorruptionLevel): boolean {
    if (corruption < CorruptionLevel.FULL) return false;
    return Math.random() < 0.2; // 20% chance at full corruption
  }

  private spawnColorStar(y: number): void {
    const graphics = this.add.graphics();
    const colorIndex = Phaser.Math.Between(0, 3);
    
    const star: ColorStar = {
      graphics,
      y,
      colorIndex,
      collected: false,
      pulsePhase: Math.random() * Math.PI * 2
    };
    
    this.drawColorStar(star);
    this.colorStars.push(star);
  }

  private drawColorStar(star: ColorStar): void {
    star.graphics.clear();
    
    const color = GAME_COLORS[star.colorIndex].hex;
    const pulse = Math.sin(star.pulsePhase) * 0.2 + 0.8;
    const size = 20 * pulse;
    
    // Glow
    star.graphics.fillStyle(color, 0.3);
    star.graphics.fillCircle(GAME_WIDTH / 2, star.y, size + 10);
    
    // Star shape
    star.graphics.fillStyle(color, 1);
    this.drawStarShape(star.graphics, GAME_WIDTH / 2, star.y, size, size / 2, 5);
    
    // Center
    star.graphics.fillStyle(0xffffff, 0.8);
    star.graphics.fillCircle(GAME_WIDTH / 2, star.y, size * 0.3);
  }

  private drawStarShape(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, outerR: number, innerR: number, points: number): void {
    const step = Math.PI / points;
    graphics.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    
    graphics.closePath();
    graphics.fillPath();
  }

  private getCorruptionLevel(): CorruptionLevel {
    if (this.score >= 30) return CorruptionLevel.FULL;
    if (this.score >= 20) return CorruptionLevel.BREAKING;
    if (this.score >= 10) return CorruptionLevel.SUBTLE;
    return CorruptionLevel.NONE;
  }

  update(time: number, delta: number): void {
    if (!this.isPlaying) return;
    
    // Update ball physics
    this.ballVelocity += GRAVITY * (delta / 1000);
    this.ballY += this.ballVelocity * (delta / 1000);
    
    // Color decay
    this.colorFreshness -= COLOR_DECAY_RATE * (delta / 16.67);
    
    // Check for gray death
    if (this.colorFreshness <= 0) {
      this.gameOver('COLOR FADED');
      return;
    }
    
    // Camera follow
    if (this.ballY < this.cameraY + GAME_HEIGHT * 0.4) {
      this.cameraY = this.ballY - GAME_HEIGHT * 0.4;
    }
    
    // Update beat
    this.updateBeat(time);
    
    // Update obstacles
    this.updateObstacles(delta);
    
    // Update stars
    this.updateStars();
    
    // Check collisions
    this.checkCollisions();
    
    // Update corruption effects
    this.updateCorruption(time, delta);
    
    // Redraw ball
    this.drawBall();
    this.drawFreshnessBar();
    
    // Spawn more obstacles
    while (this.nextObstacleY > this.cameraY - 200) {
      this.spawnObstacle();
    }
    
    // Cleanup offscreen obstacles
    this.cleanupOffscreen();
    
    // Bottom death
    if (this.ballY > this.cameraY + GAME_HEIGHT + 50) {
      this.gameOver('FELL');
    }
  }

  private updateBeat(time: number): void {
    const beatTime = (time - this.beatStartTime) % BEAT_INTERVAL;
    
    // Pulse obstacles on beat
    if (beatTime < 50 && time - this.lastBeatTime > BEAT_INTERVAL * 0.8) {
      this.lastBeatTime = time;
      this.pulseObstacles();
    }
  }

  private pulseObstacles(): void {
    for (const obstacle of this.obstacles) {
      this.tweens.add({
        targets: obstacle.container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true
      });
    }
  }

  private updateObstacles(delta: number): void {
    for (const obstacle of this.obstacles) {
      // Rotate
      obstacle.container.angle += obstacle.rotationSpeed * (delta / 16.67);
      
      // Update position relative to camera
      obstacle.container.y = obstacle.y - this.cameraY;
      
      // Check if passed
      if (!obstacle.passed && obstacle.y > this.ballY + this.cameraY) {
        obstacle.passed = true;
        this.addScore(1);
      }
    }
  }

  private updateStars(): void {
    for (const star of this.colorStars) {
      if (star.collected) continue;
      
      // Pulse animation
      star.pulsePhase += 0.1;
      star.graphics.y = star.y - this.cameraY;
      this.drawColorStar(star);
    }
  }

  private updateCorruption(time: number, delta: number): void {
    const corruption = this.getCorruptionLevel();
    
    // Scanlines intensity
    this.drawScanlines(corruption * 0.3);
    
    // Glitch effects
    this.corruptionOverlay.clear();
    
    if (corruption >= CorruptionLevel.SUBTLE) {
      this.glitchTimer += delta;
      
      if (this.glitchTimer > 100 && Math.random() < 0.1 * corruption) {
        this.glitchTimer = 0;
        this.applyGlitchEffect(corruption);
      }
    }
    
    // Color lie timer for full corruption
    if (corruption >= CorruptionLevel.FULL) {
      this.colorLieTimer += delta;
      
      if (this.colorLieTimer > 2000) {
        this.colorLieTimer = 0;
        this.refreshColorLies();
      }
    }
    
    // Screen shake at full corruption
    if (corruption >= CorruptionLevel.FULL && Math.random() < 0.02) {
      this.cameras.main.shake(100, 0.005);
    }
  }

  private applyGlitchEffect(corruption: CorruptionLevel): void {
    // Random color bars
    if (corruption >= CorruptionLevel.BREAKING) {
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const height = Phaser.Math.Between(5, 30);
      const color = GAME_COLORS[Phaser.Math.Between(0, 3)].hex;
      
      this.corruptionOverlay.fillStyle(color, 0.3);
      this.corruptionOverlay.fillRect(0, y, GAME_WIDTH, height);
      
      // Clear after short delay
      this.time.delayedCall(50, () => {
        this.corruptionOverlay.clear();
      });
    }
    
    // Score text glitch
    if (corruption >= CorruptionLevel.SUBTLE && Math.random() < 0.3) {
      const originalX = this.scoreText.x;
      this.scoreText.setX(originalX + Phaser.Math.Between(-10, 10));
      this.time.delayedCall(50, () => {
        this.scoreText.setX(originalX);
      });
    }
  }

  private refreshColorLies(): void {
    // Re-randomize which obstacles lie about their colors
    for (const obstacle of this.obstacles) {
      for (const segment of obstacle.segments) {
        if (Math.random() < 0.15) {
          const newDisplayColor = (segment.colorIndex + Phaser.Math.Between(1, 3)) % 4;
          segment.displayColorIndex = newDisplayColor;
          segment.isCorrupted = true;
          
          // Redraw segment with new color
          this.redrawSegment(obstacle, segment);
        } else if (segment.isCorrupted) {
          // Chance to restore true color
          segment.displayColorIndex = segment.colorIndex;
          segment.isCorrupted = false;
          this.redrawSegment(obstacle, segment);
        }
      }
    }
  }

  private redrawSegment(obstacle: Obstacle, segment: any): void {
    const graphics = segment.graphics;
    const color = GAME_COLORS[segment.displayColorIndex].hex;
    
    graphics.clear();
    
    if (obstacle.type === 'ring') {
      graphics.lineStyle(20, color, 1);
      graphics.beginPath();
      graphics.arc(0, 0, 80, segment.startAngle, segment.endAngle - 0.05, false);
      graphics.strokePath();
    } else if (obstacle.type === 'cross') {
      const angle = segment.startAngle + Math.PI / 4;
      const x1 = Math.cos(angle) * 30;
      const y1 = Math.sin(angle) * 30;
      const x2 = Math.cos(angle) * 100;
      const y2 = Math.sin(angle) * 100;
      graphics.lineStyle(25, color, 1);
      graphics.lineBetween(x1, y1, x2, y2);
    } else if (obstacle.type === 'bars') {
      const barWidth = GAME_WIDTH / 4 - 10;
      const barHeight = 30;
      const x = -GAME_WIDTH / 2 + segment.colorIndex * (barWidth + 10) + 5;
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(x, -barHeight / 2, barWidth, barHeight, 5);
    }
  }

  private checkCollisions(): void {
    const ballWorldY = this.ballY + this.cameraY;
    
    // Check star collection
    for (const star of this.colorStars) {
      if (star.collected) continue;
      
      const dist = Math.abs(star.y - ballWorldY);
      if (dist < BALL_RADIUS + 20) {
        this.collectStar(star);
      }
    }
    
    // Check obstacle collision
    for (const obstacle of this.obstacles) {
      const dist = Math.abs(obstacle.y - ballWorldY);
      
      if (dist < BALL_RADIUS + 30) {
        if (this.checkObstacleCollision(obstacle)) {
          if (!this.isInvincible) {
            this.gameOver('WRONG COLOR');
            return;
          }
        }
      }
    }
  }

  private checkObstacleCollision(obstacle: Obstacle): boolean {
    const ballColorIndex = this.ballColorIndex;
    
    // Check which segment the ball is passing through
    for (const segment of obstacle.segments) {
      // Simplified collision - check if ball overlaps with obstacle zone
      const segmentActive = this.isSegmentAtBallPosition(obstacle, segment);
      
      if (segmentActive) {
        // Use the REAL color index for collision, not display
        if (segment.colorIndex !== ballColorIndex) {
          return true; // Collision!
        }
      }
    }
    
    return false;
  }

  private isSegmentAtBallPosition(obstacle: Obstacle, segment: any): boolean {
    // For bars, check x position
    if (obstacle.type === 'bars') {
      const barWidth = GAME_WIDTH / 4 - 10;
      const barX = -GAME_WIDTH / 2 + segment.colorIndex * (barWidth + 10) + 5 + barWidth / 2;
      return Math.abs(barX) < barWidth / 2 + BALL_RADIUS;
    }
    
    // For rings/cross, check angle-based position
    const rotation = Phaser.Math.DegToRad(obstacle.container.angle);
    const adjustedStart = segment.startAngle + rotation;
    const adjustedEnd = segment.endAngle + rotation;
    
    // Ball is at center, so check if -PI/2 (top) is in segment range
    const ballAngle = -Math.PI / 2;
    const normStart = ((adjustedStart % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const normEnd = ((adjustedEnd % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const normBall = ((ballAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    if (normStart <= normEnd) {
      return normBall >= normStart && normBall <= normEnd;
    } else {
      return normBall >= normStart || normBall <= normEnd;
    }
  }

  private collectStar(star: ColorStar): void {
    star.collected = true;
    star.graphics.destroy();
    
    // Change and refresh color
    this.ballColorIndex = star.colorIndex;
    this.colorFreshness = Math.min(1.0, this.colorFreshness + COLOR_REFRESH_AMOUNT);
    
    // Visual feedback
    this.cameras.main.flash(100, 
      GAME_COLORS[star.colorIndex].rgb.r,
      GAME_COLORS[star.colorIndex].rgb.g,
      GAME_COLORS[star.colorIndex].rgb.b
    );
    
    // Bonus point
    this.addScore(1);
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(this.score.toString());
    
    // Report to SDK
    if (typeof FarcadeSDK !== 'undefined') {
      FarcadeSDK.reportScore(this.score);
    }
    
    // Scale animation
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true
    });
  }

  private cleanupOffscreen(): void {
    const screenBottom = this.cameraY + GAME_HEIGHT + 200;
    
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.y > screenBottom) {
        obs.container.destroy();
        return false;
      }
      return true;
    });
    
    this.colorStars = this.colorStars.filter(star => {
      if (star.y > screenBottom) {
        if (!star.collected) star.graphics.destroy();
        return false;
      }
      return true;
    });
  }

  private gameOver(reason: string): void {
    this.isPlaying = false;
    
    // Final score report
    if (typeof FarcadeSDK !== 'undefined') {
      FarcadeSDK.reportScore(this.score);
    }
    
    // Store data for game over scene
    this.registry.set('score', this.score);
    this.registry.set('deathReason', reason);
    this.registry.set('corruption', this.getCorruptionLevel());
    
    // Dramatic death effect
    this.cameras.main.shake(500, 0.03);
    this.cameras.main.flash(300, 255, 0, 0);
    
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene');
    });
  }
}
