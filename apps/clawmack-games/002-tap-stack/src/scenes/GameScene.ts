import Phaser from 'phaser';
import {
  Element,
  GravityDirection,
  ELEMENT_COLORS,
  StackBlock,
  GameState,
  areIncompatible,
  areCompatible,
  getRandomElement,
  getGravityDirection,
} from '../types';

export class GameScene extends Phaser.Scene {
  // Game dimensions
  private gameWidth!: number;
  private gameHeight!: number;
  
  // Tower container (rotates with gravity)
  private towerContainer!: Phaser.GameObjects.Container;
  
  // Blocks
  private stack: StackBlock[] = [];
  private movingBlock: StackBlock | null = null;
  private baseBlock!: StackBlock;
  
  // Block settings
  private readonly BLOCK_HEIGHT = 35;
  private readonly INITIAL_WIDTH = 180;
  private readonly PERFECT_THRESHOLD = 8;
  
  // Movement
  private blockSpeed = 4;
  private movingRight = true;
  
  // Game state
  private state: GameState = {
    score: 0,
    blocksPlaced: 0,
    gravityIndex: 0,
    perfectionMeter: 0,
    isGoldenBlock: false,
    towerAwakening: 0,
    consecutivePerfects: 0,
  };
  
  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private perfectionBar!: Phaser.GameObjects.Graphics;
  private gravityIndicator!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  
  // Tower breathing/sway
  private breatheTime = 0;
  private swayTime = 0;
  
  // Pending gravity change
  private pendingGravityChange = false;
  
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameWidth = this.scale.width;
    this.gameHeight = this.scale.height;
    
    // Reset state
    this.state = {
      score: 0,
      blocksPlaced: 0,
      gravityIndex: 0,
      perfectionMeter: 0,
      isGoldenBlock: false,
      towerAwakening: 0,
      consecutivePerfects: 0,
    };
    this.stack = [];
    this.movingBlock = null;
    this.blockSpeed = 4;
    this.movingRight = true;
    this.pendingGravityChange = false;
    
    this.cameras.main.fadeIn(300, 10, 10, 18);
    
    // Create atmospheric background
    this.createBackground();
    
    // Tower container at center
    this.towerContainer = this.add.container(this.gameWidth / 2, this.gameHeight * 0.75);
    
    // Create base block
    this.createBaseBlock();
    
    // Create UI
    this.createUI();
    
    // Spawn first moving block
    this.spawnMovingBlock();
    
    // Input
    this.input.on('pointerdown', this.handleTap, this);
  }

  private createBackground(): void {
    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a18, 0x0a0a18, 0x151528, 0x151528, 1);
    bg.fillRect(0, 0, this.gameWidth, this.gameHeight);
    
    // Floating ambient particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, this.gameWidth);
      const y = Phaser.Math.Between(0, this.gameHeight);
      const colors = [0xff4422, 0x2266ff, 0x88ddff, 0xffee00];
      const color = Phaser.Math.RND.pick(colors);
      
      const particle = this.add.circle(x, y, Phaser.Math.Between(1, 3), color, 0.3);
      
      this.tweens.add({
        targets: particle,
        y: y - 100,
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => {
          particle.y = this.gameHeight + 20;
          particle.x = Phaser.Math.Between(0, this.gameWidth);
          particle.alpha = 0.3;
        },
      });
    }
  }

  private createUI(): void {
    // Score
    this.scoreText = this.add.text(this.gameWidth / 2, 60, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(100);
    
    // Perfection meter background
    const meterWidth = 120;
    const meterHeight = 8;
    const meterX = this.gameWidth / 2 - meterWidth / 2;
    const meterY = 100;
    
    this.add.rectangle(meterX + meterWidth / 2, meterY + meterHeight / 2, meterWidth, meterHeight, 0x222233)
      .setDepth(100);
    
    this.perfectionBar = this.add.graphics().setDepth(100);
    this.updatePerfectionMeter();
    
    // Perfection label
    this.add.text(this.gameWidth / 2, meterY + 20, 'PERFECTION', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#666688',
    }).setOrigin(0.5).setDepth(100);
    
    // Gravity indicator
    this.gravityIndicator = this.add.text(this.gameWidth - 20, 50, '↓', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#666688',
    }).setOrigin(0.5).setDepth(100);
    
    // Combo text (hidden initially)
    this.comboText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffee00',
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
  }

  private createBaseBlock(): void {
    const element = getRandomElement();
    const colors = ELEMENT_COLORS[element];
    
    // Glow effect
    const glow = this.add.rectangle(0, 0, this.INITIAL_WIDTH + 10, this.BLOCK_HEIGHT + 10, colors.glow, 0.3);
    
    // Main block
    const sprite = this.add.rectangle(0, 0, this.INITIAL_WIDTH, this.BLOCK_HEIGHT, colors.primary);
    sprite.setStrokeStyle(2, 0xffffff, 0.3);
    
    this.baseBlock = {
      sprite,
      glow,
      element,
      width: this.INITIAL_WIDTH,
      x: 0,
      y: 0,
    };
    
    this.towerContainer.add([glow, sprite]);
    this.stack.push(this.baseBlock);
  }

  private spawnMovingBlock(): void {
    const topBlock = this.stack[this.stack.length - 1];
    const newWidth = topBlock.width;
    
    // Choose element (slightly favor different elements for gameplay variety)
    let element: Element;
    if (this.state.isGoldenBlock) {
      element = topBlock.element; // Golden block matches for guaranteed bonus
    } else {
      element = getRandomElement();
    }
    
    const colors = ELEMENT_COLORS[element];
    
    // Starting position (off-screen based on current gravity direction)
    const startX = this.movingRight ? -this.gameWidth / 2 : this.gameWidth / 2;
    const yPos = -((this.stack.length) * this.BLOCK_HEIGHT);
    
    // Glow effect (golden blocks glow more intensely)
    const glowAlpha = this.state.isGoldenBlock ? 0.8 : 0.3;
    const glowColor = this.state.isGoldenBlock ? 0xffd700 : colors.glow;
    const glow = this.add.rectangle(startX, yPos, newWidth + 10, this.BLOCK_HEIGHT + 10, glowColor, glowAlpha);
    
    // Main block (golden tint if golden block)
    const blockColor = this.state.isGoldenBlock ? 0xffd700 : colors.primary;
    const sprite = this.add.rectangle(startX, yPos, newWidth, this.BLOCK_HEIGHT, blockColor);
    sprite.setStrokeStyle(2, this.state.isGoldenBlock ? 0xffffff : 0xffffff, this.state.isGoldenBlock ? 0.8 : 0.3);
    
    // Golden block pulsing effect
    if (this.state.isGoldenBlock) {
      this.tweens.add({
        targets: [sprite, glow],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    
    this.movingBlock = {
      sprite,
      glow,
      element,
      width: newWidth,
      x: startX,
      y: yPos,
    };
    
    this.towerContainer.add([glow, sprite]);
    
    // Adjust speed based on golden block and awakening
    let speed = 4 + Math.min(this.state.blocksPlaced * 0.15, 6);
    if (this.state.isGoldenBlock) {
      speed *= 2; // Golden blocks are twice as fast!
    }
    // Tower resistance when awakened
    speed *= (1 + this.state.towerAwakening * 0.3);
    this.blockSpeed = speed;
  }

  private handleTap(): void {
    if (!this.movingBlock || this.pendingGravityChange) return;
    
    const moving = this.movingBlock;
    const topBlock = this.stack[this.stack.length - 1];
    
    // Calculate overlap
    const movingLeft = moving.x - moving.width / 2;
    const movingRight = moving.x + moving.width / 2;
    const topLeft = topBlock.x - topBlock.width / 2;
    const topRight = topBlock.x + topBlock.width / 2;
    
    const overlapLeft = Math.max(movingLeft, topLeft);
    const overlapRight = Math.min(movingRight, topRight);
    const overlapWidth = overlapRight - overlapLeft;
    
    // Check for miss
    if (overlapWidth <= 0) {
      this.handleMiss();
      return;
    }
    
    // Calculate how perfect the placement was
    const offset = Math.abs(moving.x - topBlock.x);
    const isPerfect = offset <= this.PERFECT_THRESHOLD;
    
    // Create the placed block
    const newX = overlapLeft + overlapWidth / 2;
    const finalWidth = isPerfect ? topBlock.width : overlapWidth;
    
    // Check elemental compatibility
    const isIncompatible = areIncompatible(moving.element, topBlock.element);
    const isCompatible = areCompatible(moving.element, topBlock.element);
    
    // Remove moving block visuals
    moving.sprite.destroy();
    moving.glow.destroy();
    
    // Handle golden block result
    if (this.state.isGoldenBlock) {
      if (isPerfect) {
        this.showCombo('GOLDEN PERFECT!', 0xffd700);
        this.state.score += 50;
      } else {
        // Missed golden block - lose 3 blocks!
        this.state.isGoldenBlock = false;
        this.state.perfectionMeter = 0;
        this.removeTopBlocks(3);
        this.showCombo('CURSE TRIGGERED!', 0xff0000);
        this.cameras.main.shake(300, 0.02);
        if (this.stack.length <= 1) {
          this.gameOver();
          return;
        }
        this.spawnMovingBlock();
        return;
      }
    }
    
    this.state.isGoldenBlock = false;
    
    // Create placed block
    const colors = ELEMENT_COLORS[moving.element];
    const placedGlow = this.add.rectangle(newX, moving.y, finalWidth + 10, this.BLOCK_HEIGHT + 10, colors.glow, 0.3);
    const placedSprite = this.add.rectangle(newX, moving.y, finalWidth, this.BLOCK_HEIGHT, colors.primary);
    placedSprite.setStrokeStyle(2, 0xffffff, 0.3);
    
    const placedBlock: StackBlock = {
      sprite: placedSprite,
      glow: placedGlow,
      element: moving.element,
      width: finalWidth,
      x: newX,
      y: moving.y,
    };
    
    this.towerContainer.add([placedGlow, placedSprite]);
    this.stack.push(placedBlock);
    
    // Handle elemental effects
    if (isIncompatible) {
      this.triggerExplosion(placedBlock, topBlock);
    } else if (isCompatible) {
      this.triggerElementalBonus(moving.element);
    }
    
    // Update state
    this.state.blocksPlaced++;
    this.state.score += isPerfect ? 15 : 10;
    
    // Perfection meter
    if (isPerfect) {
      this.state.consecutivePerfects++;
      this.state.perfectionMeter = Math.min(1, this.state.perfectionMeter + 0.25);
      this.showCombo(`PERFECT x${this.state.consecutivePerfects}`, 0x44ff44);
      
      // Full perfection meter = golden block
      if (this.state.perfectionMeter >= 1) {
        this.state.isGoldenBlock = true;
        this.state.perfectionMeter = 0;
        this.showCombo('GOLDEN BLOCK INCOMING!', 0xffd700);
      }
    } else {
      this.state.consecutivePerfects = 0;
      this.state.perfectionMeter = Math.max(0, this.state.perfectionMeter - 0.1);
    }
    
    // Tower awakening (increases at high scores)
    if (this.state.blocksPlaced > 15) {
      this.state.towerAwakening = Math.min(1, (this.state.blocksPlaced - 15) / 30);
      this.maybeAddEyes(placedBlock);
    }
    
    // Update UI
    this.scoreText.setText(this.state.score.toString());
    this.updatePerfectionMeter();
    
    // Check for gravity change (every 5 blocks)
    if (this.state.blocksPlaced % 5 === 0 && this.state.blocksPlaced > 0) {
      this.changeGravity();
    } else {
      // Camera follows tower
      this.scrollCamera();
      this.movingBlock = null;
      this.spawnMovingBlock();
    }
  }

  private handleMiss(): void {
    // Complete miss - game over
    this.movingBlock?.sprite.destroy();
    this.movingBlock?.glow.destroy();
    
    // Falling animation
    this.cameras.main.shake(200, 0.015);
    
    this.time.delayedCall(300, () => {
      this.gameOver();
    });
  }

  private removeTopBlocks(count: number): void {
    for (let i = 0; i < count && this.stack.length > 1; i++) {
      const block = this.stack.pop();
      if (block) {
        // Dramatic removal animation
        this.tweens.add({
          targets: [block.sprite, block.glow, block.eyes].filter(Boolean),
          alpha: 0,
          y: (block.y as number) + 100,
          rotation: Phaser.Math.FloatBetween(-0.5, 0.5),
          duration: 400,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            block.sprite.destroy();
            block.glow.destroy();
            block.eyes?.destroy();
          },
        });
      }
    }
  }

  private triggerExplosion(block1: StackBlock, block2: StackBlock): void {
    this.showCombo('ELEMENTAL CLASH!', 0xff4422);
    
    // Shake camera
    this.cameras.main.shake(400, 0.025);
    
    // Knock the tower slightly
    this.tweens.add({
      targets: this.towerContainer,
      x: this.towerContainer.x + Phaser.Math.Between(-15, 15),
      duration: 100,
      yoyo: true,
      repeat: 3,
    });
    
    // Create explosion particles
    const colors = [ELEMENT_COLORS[block1.element].glow, ELEMENT_COLORS[block2.element].glow];
    for (let i = 0; i < 20; i++) {
      const color = Phaser.Math.RND.pick(colors);
      const particle = this.add.circle(
        this.gameWidth / 2 + block1.x,
        this.gameHeight * 0.75 + block1.y,
        Phaser.Math.Between(3, 8),
        color
      );
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
    
    // Reduce score
    this.state.score = Math.max(0, this.state.score - 5);
    this.scoreText.setText(this.state.score.toString());
  }

  private triggerElementalBonus(element: Element): void {
    const bonusMessages: Record<Element, string> = {
      [Element.FIRE]: 'FIRE SURGE!',
      [Element.WATER]: 'TIDAL WAVE!',
      [Element.ICE]: 'FROZEN POWER!',
      [Element.ELECTRIC]: 'LIGHTNING STRIKE!',
    };
    
    this.showCombo(bonusMessages[element], ELEMENT_COLORS[element].glow);
    this.state.score += 5;
    this.scoreText.setText(this.state.score.toString());
    
    // Visual burst effect
    const burst = this.add.circle(this.gameWidth / 2, this.gameHeight * 0.5, 10, ELEMENT_COLORS[element].glow, 0.8);
    this.tweens.add({
      targets: burst,
      scale: 8,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy(),
    });
  }

  private maybeAddEyes(block: StackBlock): void {
    // Higher awakening = more likely to get eyes
    if (Math.random() > this.state.towerAwakening * 0.6) return;
    
    const eyeContainer = this.add.container(block.x, block.y);
    
    // Two eyes
    const eyeOffsetX = block.width * 0.2;
    const eyeSize = 6;
    
    [-1, 1].forEach((dir) => {
      const eyeWhite = this.add.circle(dir * eyeOffsetX, 0, eyeSize, 0xffffff);
      const pupil = this.add.circle(dir * eyeOffsetX, 0, eyeSize * 0.5, 0x111111);
      eyeContainer.add([eyeWhite, pupil]);
      
      // Random blinking
      this.time.addEvent({
        delay: Phaser.Math.Between(2000, 5000),
        callback: () => {
          if (eyeWhite.active) {
            this.tweens.add({
              targets: [eyeWhite, pupil],
              scaleY: 0.1,
              duration: 100,
              yoyo: true,
            });
          }
        },
        loop: true,
      });
      
      // Pupils follow moving block
      this.time.addEvent({
        delay: 100,
        callback: () => {
          if (this.movingBlock && pupil.active) {
            const targetX = Phaser.Math.Clamp(
              (this.movingBlock.x - block.x) * 0.1,
              -eyeSize * 0.3,
              eyeSize * 0.3
            );
            pupil.x = dir * eyeOffsetX + targetX;
          }
        },
        loop: true,
      });
    });
    
    this.towerContainer.add(eyeContainer);
    block.eyes = eyeContainer;
  }

  private changeGravity(): void {
    this.pendingGravityChange = true;
    this.state.gravityIndex = (this.state.gravityIndex + 1) % 4;
    const newDirection = getGravityDirection(this.state.gravityIndex);
    
    // Update gravity indicator
    const arrows = ['↓', '←', '↑', '→'];
    this.gravityIndicator.setText(arrows[this.state.gravityIndex]);
    
    this.showCombo('GRAVITY SHIFT!', 0x8844ff);
    
    // Smooth camera rotation
    this.tweens.add({
      targets: this.towerContainer,
      angle: newDirection,
      duration: 800,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.pendingGravityChange = false;
        this.scrollCamera();
        this.movingBlock = null;
        this.movingRight = !this.movingRight;
        this.spawnMovingBlock();
      },
    });
  }

  private scrollCamera(): void {
    // Move tower container down to keep the action in view
    const targetY = this.gameHeight * 0.75 + (this.stack.length - 3) * this.BLOCK_HEIGHT;
    
    this.tweens.add({
      targets: this.towerContainer,
      y: Math.min(this.gameHeight * 0.75, targetY),
      duration: 200,
      ease: 'Cubic.easeOut',
    });
  }

  private updatePerfectionMeter(): void {
    this.perfectionBar.clear();
    
    const meterWidth = 120;
    const meterHeight = 8;
    const meterX = this.gameWidth / 2 - meterWidth / 2;
    const meterY = 100;
    
    // Draw filled portion
    const fillWidth = meterWidth * this.state.perfectionMeter;
    if (fillWidth > 0) {
      const color = this.state.perfectionMeter >= 1 ? 0xffd700 : 0x44ff44;
      this.perfectionBar.fillStyle(color);
      this.perfectionBar.fillRect(meterX, meterY, fillWidth, meterHeight);
    }
  }

  private showCombo(text: string, color: number): void {
    this.comboText.setText(text);
    this.comboText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.comboText.setAlpha(1);
    this.comboText.setScale(0.5);
    this.comboText.y = this.gameHeight / 2;
    
    this.tweens.add({
      targets: this.comboText,
      scale: 1,
      y: this.gameHeight / 2 - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
    });
  }

  private gameOver(): void {
    this.scene.start('GameOverScene', {
      score: this.state.score,
      blocksPlaced: this.state.blocksPlaced,
    });
  }

  update(_time: number, delta: number): void {
    // Move block
    if (this.movingBlock && !this.pendingGravityChange) {
      const speed = this.blockSpeed * (delta / 16.67);
      
      if (this.movingRight) {
        this.movingBlock.x += speed;
        if (this.movingBlock.x > this.gameWidth / 2) {
          this.movingRight = false;
        }
      } else {
        this.movingBlock.x -= speed;
        if (this.movingBlock.x < -this.gameWidth / 2) {
          this.movingRight = true;
        }
      }
      
      this.movingBlock.sprite.x = this.movingBlock.x;
      this.movingBlock.glow.x = this.movingBlock.x;
    }
    
    // Tower breathing effect
    this.breatheTime += delta * 0.001;
    this.swayTime += delta * 0.0008;
    
    const breathe = Math.sin(this.breatheTime * 2) * 0.01;
    const sway = Math.sin(this.swayTime) * (0.5 + this.state.towerAwakening * 2);
    
    // Apply subtle sway to tower blocks (more pronounced when awakened)
    this.stack.forEach((block, index) => {
      if (index > 0 && block.sprite.active) {
        const swayAmount = sway * (index / this.stack.length);
        block.sprite.x = block.x + swayAmount;
        block.glow.x = block.x + swayAmount;
        if (block.eyes) {
          block.eyes.x = block.x + swayAmount;
        }
        
        // Breathing scale
        const scale = 1 + breathe * (index / this.stack.length) * this.state.towerAwakening;
        block.sprite.setScale(1, scale);
        block.glow.setScale(1, scale);
      }
    });
  }
}
