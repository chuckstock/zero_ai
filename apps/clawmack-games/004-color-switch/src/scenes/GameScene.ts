import Phaser from 'phaser';
import { remix } from '../remix-sdk';

// Color palette - neon style
const COLORS = {
  CYAN: 0x00f5ff,
  MAGENTA: 0xff00ff,
  YELLOW: 0xffff00,
  GREEN: 0x39ff14
};

const COLOR_ARRAY = [COLORS.CYAN, COLORS.MAGENTA, COLORS.YELLOW, COLORS.GREEN];
const COLOR_NAMES = ['cyan', 'magenta', 'yellow', 'green'];

interface ColorWheel extends Phaser.GameObjects.Container {
  rotationSpeed: number;
  passed: boolean;
}

interface ColorStar extends Phaser.GameObjects.Container {
  collected: boolean;
}

export class GameScene extends Phaser.Scene {
  private ball!: Phaser.GameObjects.Arc;
  private ballColor: number = 0;
  private obstacles: ColorWheel[] = [];
  private stars: ColorStar[] = [];
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private cameraY: number = 0;
  private nextObstacleY: number = 0;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private difficulty: number = 1;
  private tapText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.resetGame();
    this.createBackground();
    this.createBall();
    this.createUI();
    this.createParticles();
    this.setupInput();
    this.setupPlayAgain();
    
    // Initial obstacles
    this.nextObstacleY = 900;
    for (let i = 0; i < 5; i++) {
      this.spawnObstacle();
    }
  }

  private resetGame(): void {
    this.score = 0;
    this.isGameOver = false;
    this.gameStarted = false;
    this.cameraY = 0;
    this.nextObstacleY = 900;
    this.difficulty = 1;
    this.ballColor = 0;
    
    // Clear existing objects
    this.obstacles.forEach(o => o.destroy());
    this.obstacles = [];
    this.stars.forEach(s => s.destroy());
    this.stars = [];
  }

  private createBackground(): void {
    // Gradient background effect with particles
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bgGraphics.fillRect(0, -10000, 720, 20000);
    bgGraphics.setScrollFactor(0.1);

    // Ambient particles
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 720);
      const y = Phaser.Math.Between(-5000, 5000);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff, 0.3);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.1, to: 0.5 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  private createBall(): void {
    this.ball = this.add.circle(360, 1100, 20, COLOR_ARRAY[this.ballColor]);
    this.ball.setStrokeStyle(3, 0xffffff, 0.8);
    
    // Add glow effect
    const glow = this.add.circle(360, 1100, 30, COLOR_ARRAY[this.ballColor], 0.3);
    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 500,
      repeat: -1
    });

    // Physics body
    this.physics.add.existing(this.ball);
    const body = this.ball.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20);
    body.setBounce(0);
    body.setCollideWorldBounds(false);
    body.setGravityY(0); // No gravity until game starts
  }

  private createUI(): void {
    // Score display
    this.scoreText = this.add.text(360, 100, '0', {
      fontSize: '80px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    // Tap to start text
    this.tapText = this.add.text(360, 640, 'TAP TO START', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff'
    });
    this.tapText.setOrigin(0.5);
    this.tapText.setScrollFactor(0);
    this.tapText.setDepth(100);
    
    this.tweens.add({
      targets: this.tapText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  private createParticles(): void {
    this.particles = this.add.particles(0, 0, undefined, {
      speed: { min: 100, max: 300 },
      scale: { start: 0.4, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      emitting: false
    });
    this.particles.setDepth(50);
  }

  private setupInput(): void {
    this.input.on('pointerdown', () => {
      if (this.isGameOver) return;

      if (!this.gameStarted) {
        this.startGame();
        return;
      }

      this.jump();
    });
  }

  private startGame(): void {
    this.gameStarted = true;
    this.tapText.setVisible(false);
    
    const body = this.ball.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(800);
    
    this.jump();
  }

  private jump(): void {
    const body = this.ball.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-500);
    remix.haptic();
    
    // Jump particles
    this.emitParticles(this.ball.x, this.ball.y + 20, COLOR_ARRAY[this.ballColor], 5);
  }

  private setupPlayAgain(): void {
    remix.onPlayAgain(() => {
      this.scene.restart();
    });
  }

  private spawnObstacle(): void {
    const obstacleType = Phaser.Math.Between(0, 2);
    let obstacle: ColorWheel;

    switch (obstacleType) {
      case 0:
        obstacle = this.createColorWheel(360, this.nextObstacleY);
        break;
      case 1:
        obstacle = this.createDoubleRing(360, this.nextObstacleY);
        break;
      default:
        obstacle = this.createSquareObstacle(360, this.nextObstacleY);
    }

    this.obstacles.push(obstacle);

    // Spawn color star above obstacle
    const star = this.createColorStar(360, this.nextObstacleY - 180);
    this.stars.push(star);

    this.nextObstacleY -= 400;
  }

  private createColorWheel(x: number, y: number): ColorWheel {
    const container = this.add.container(x, y) as ColorWheel;
    const radius = 100;
    const thickness = 25;

    // Draw 4 colored arcs
    for (let i = 0; i < 4; i++) {
      const arc = this.add.graphics();
      arc.lineStyle(thickness, COLOR_ARRAY[i], 1);
      arc.beginPath();
      arc.arc(0, 0, radius, 
        Phaser.Math.DegToRad(i * 90), 
        Phaser.Math.DegToRad((i + 1) * 90), 
        false
      );
      arc.strokePath();
      container.add(arc);
    }

    // Inner glow
    const innerGlow = this.add.circle(0, 0, radius - thickness/2, 0x1a1a2e, 1);
    container.add(innerGlow);

    container.rotationSpeed = 0.02 * this.difficulty;
    container.passed = false;

    return container;
  }

  private createDoubleRing(x: number, y: number): ColorWheel {
    const container = this.add.container(x, y) as ColorWheel;
    
    // Outer ring
    const outerRadius = 120;
    const innerRadius = 80;
    const thickness = 20;

    for (let i = 0; i < 4; i++) {
      // Outer arc
      const outerArc = this.add.graphics();
      outerArc.lineStyle(thickness, COLOR_ARRAY[i], 1);
      outerArc.beginPath();
      outerArc.arc(0, 0, outerRadius, 
        Phaser.Math.DegToRad(i * 90), 
        Phaser.Math.DegToRad((i + 1) * 90), 
        false
      );
      outerArc.strokePath();
      container.add(outerArc);

      // Inner arc (opposite rotation)
      const innerArc = this.add.graphics();
      innerArc.lineStyle(thickness, COLOR_ARRAY[(i + 2) % 4], 1);
      innerArc.beginPath();
      innerArc.arc(0, 0, innerRadius, 
        Phaser.Math.DegToRad(i * 90), 
        Phaser.Math.DegToRad((i + 1) * 90), 
        false
      );
      innerArc.strokePath();
      container.add(innerArc);
    }

    // Center
    const center = this.add.circle(0, 0, innerRadius - thickness/2, 0x1a1a2e, 1);
    container.add(center);

    container.rotationSpeed = 0.025 * this.difficulty;
    container.passed = false;

    return container;
  }

  private createSquareObstacle(x: number, y: number): ColorWheel {
    const container = this.add.container(x, y) as ColorWheel;
    const size = 180;
    const thickness = 25;
    const halfSize = size / 2;

    // Four colored sides
    const sides = [
      { x1: -halfSize, y1: -halfSize, x2: halfSize, y2: -halfSize }, // top
      { x1: halfSize, y1: -halfSize, x2: halfSize, y2: halfSize },   // right
      { x1: halfSize, y1: halfSize, x2: -halfSize, y2: halfSize },   // bottom
      { x1: -halfSize, y1: halfSize, x2: -halfSize, y2: -halfSize }  // left
    ];

    sides.forEach((side, i) => {
      const line = this.add.graphics();
      line.lineStyle(thickness, COLOR_ARRAY[i], 1);
      line.lineBetween(side.x1, side.y1, side.x2, side.y2);
      container.add(line);
    });

    container.rotationSpeed = 0.018 * this.difficulty;
    container.passed = false;

    return container;
  }

  private createColorStar(x: number, y: number): ColorStar {
    const container = this.add.container(x, y) as ColorStar;
    
    // Star shape with multiple colors
    const starGraphics = this.add.graphics();
    const points = 8;
    const outerRadius = 25;
    const innerRadius = 12;

    for (let i = 0; i < points; i++) {
      const angle1 = (i / points) * Math.PI * 2 - Math.PI / 2;
      const angle2 = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
      
      starGraphics.lineStyle(3, COLOR_ARRAY[i % 4], 1);
      starGraphics.beginPath();
      starGraphics.moveTo(
        Math.cos(angle1) * outerRadius,
        Math.sin(angle1) * outerRadius
      );
      starGraphics.lineTo(
        Math.cos(angle2) * innerRadius,
        Math.sin(angle2) * innerRadius
      );
      starGraphics.strokePath();
    }

    container.add(starGraphics);

    // Pulsing animation
    this.tweens.add({
      targets: container,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Slow rotation
    this.tweens.add({
      targets: container,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1
    });

    container.collected = false;

    return container;
  }

  private emitParticles(x: number, y: number, color: number, count: number): void {
    // Create temporary colored circle for particles
    const tempGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    tempGraphics.fillStyle(color, 1);
    tempGraphics.fillCircle(8, 8, 8);
    tempGraphics.generateTexture('particle_' + color, 16, 16);
    tempGraphics.destroy();

    this.particles.setTexture('particle_' + color);
    this.particles.setPosition(x, y);
    this.particles.explode(count);
  }

  private checkCollisions(): void {
    const ballY = this.ball.y;
    const ballX = this.ball.x;

    // Check obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.passed) continue;

      const obstacleY = obstacle.y;
      const distance = Math.sqrt(
        Math.pow(ballX - obstacle.x, 2) + 
        Math.pow(ballY - obstacleY, 2)
      );

      // Check if ball is passing through
      if (distance < 130 && distance > 60) {
        // Calculate angle from center to ball
        let angle = Math.atan2(ballY - obstacleY, ballX - obstacle.x);
        angle = angle - obstacle.rotation; // Account for rotation
        
        // Normalize angle to 0-2PI
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;

        // Determine which color segment (0-3)
        const segment = Math.floor((angle + Math.PI / 4) / (Math.PI / 2)) % 4;

        if (segment !== this.ballColor) {
          this.gameOver();
          return;
        }
      }

      // Check if passed obstacle
      if (ballY < obstacleY - 50 && !obstacle.passed) {
        obstacle.passed = true;
        this.score++;
        this.scoreText.setText(this.score.toString());
        this.emitParticles(ballX, ballY, COLOR_ARRAY[this.ballColor], 10);
        remix.haptic();
        
        // Increase difficulty
        if (this.score % 5 === 0) {
          this.difficulty = Math.min(this.difficulty + 0.1, 2.5);
        }

        // Spawn new obstacle
        this.spawnObstacle();
      }
    }

    // Check stars
    for (const star of this.stars) {
      if (star.collected) continue;

      const distance = Math.sqrt(
        Math.pow(ballX - star.x, 2) + 
        Math.pow(ballY - star.y, 2)
      );

      if (distance < 40) {
        star.collected = true;
        star.setVisible(false);
        this.changeColor();
        this.emitParticles(star.x, star.y, 0xffffff, 15);
        remix.haptic();
      }
    }
  }

  private changeColor(): void {
    // Change to a random different color
    let newColor = this.ballColor;
    while (newColor === this.ballColor) {
      newColor = Phaser.Math.Between(0, 3);
    }
    this.ballColor = newColor;
    this.ball.setFillStyle(COLOR_ARRAY[this.ballColor]);
  }

  private gameOver(): void {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    remix.haptic();

    // Explosion effect
    for (let i = 0; i < 4; i++) {
      this.emitParticles(this.ball.x, this.ball.y, COLOR_ARRAY[i], 10);
    }

    // Flash and hide ball
    this.tweens.add({
      targets: this.ball,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300
    });

    // Stop ball physics
    const body = this.ball.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setGravityY(0);

    // Show game over UI
    this.time.delayedCall(500, () => {
      const gameOverText = this.add.text(360, 500, 'GAME OVER', {
        fontSize: '64px',
        fontFamily: 'Arial Black, Arial',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 6
      });
      gameOverText.setOrigin(0.5);
      gameOverText.setScrollFactor(0);
      gameOverText.setDepth(100);

      const finalScore = this.add.text(360, 600, `Score: ${this.score}`, {
        fontSize: '48px',
        fontFamily: 'Arial',
        color: '#ffffff'
      });
      finalScore.setOrigin(0.5);
      finalScore.setScrollFactor(0);
      finalScore.setDepth(100);

      // Send score to Remix
      remix.gameOver(this.score);

      // Tap to restart text
      const restartText = this.add.text(360, 750, 'Tap to restart', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#aaaaaa'
      });
      restartText.setOrigin(0.5);
      restartText.setScrollFactor(0);
      restartText.setDepth(100);

      this.tweens.add({
        targets: restartText,
        alpha: { from: 1, to: 0.3 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      // Allow restart after delay
      this.time.delayedCall(1000, () => {
        this.input.once('pointerdown', () => {
          this.scene.restart();
        });
      });
    });
  }

  private updateCamera(): void {
    if (!this.gameStarted) return;
    
    // Smooth camera follow
    const targetY = this.ball.y - 800;
    if (targetY < this.cameraY) {
      this.cameraY = Phaser.Math.Linear(this.cameraY, targetY, 0.1);
      this.cameras.main.scrollY = this.cameraY;
    }
  }

  private cleanupOffscreen(): void {
    // Remove obstacles that are far below camera
    this.obstacles = this.obstacles.filter(obstacle => {
      if (obstacle.y > this.cameraY + 1500) {
        obstacle.destroy();
        return false;
      }
      return true;
    });

    // Remove collected/offscreen stars
    this.stars = this.stars.filter(star => {
      if (star.y > this.cameraY + 1500 || star.collected) {
        star.destroy();
        return false;
      }
      return true;
    });
  }

  update(_time: number, _delta: number): void {
    if (this.isGameOver) return;

    // Rotate obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.rotation += obstacle.rotationSpeed;
    });

    if (!this.gameStarted) return;

    // Check if ball fell too far
    if (this.ball.y > this.cameraY + 1400) {
      this.gameOver();
      return;
    }

    this.checkCollisions();
    this.updateCamera();
    this.cleanupOffscreen();
  }
}
