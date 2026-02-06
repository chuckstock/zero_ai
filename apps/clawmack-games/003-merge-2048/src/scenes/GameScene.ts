import Phaser from 'phaser'
import { remix } from '../remix-sdk'

interface Tile {
  value: number
  sprite: Phaser.GameObjects.Container
  row: number
  col: number
  mergedThisTurn: boolean
}

// Color palette for tiles based on value
const TILE_COLORS: Record<number, { bg: number; text: string }> = {
  2: { bg: 0xeee4da, text: '#776e65' },
  4: { bg: 0xede0c8, text: '#776e65' },
  8: { bg: 0xf2b179, text: '#f9f6f2' },
  16: { bg: 0xf59563, text: '#f9f6f2' },
  32: { bg: 0xf67c5f, text: '#f9f6f2' },
  64: { bg: 0xf65e3b, text: '#f9f6f2' },
  128: { bg: 0xedcf72, text: '#f9f6f2' },
  256: { bg: 0xedcc61, text: '#f9f6f2' },
  512: { bg: 0xedc850, text: '#f9f6f2' },
  1024: { bg: 0xedc53f, text: '#f9f6f2' },
  2048: { bg: 0xedc22e, text: '#f9f6f2' },
  4096: { bg: 0x3c3a32, text: '#f9f6f2' },
  8192: { bg: 0x3c3a32, text: '#f9f6f2' }
}

export class GameScene extends Phaser.Scene {
  private grid: (Tile | null)[][] = []
  private gridSize = 4
  private tileSize = 140
  private tileGap = 12
  private gridX = 0
  private gridY = 0
  private score = 0
  private highScore = 0
  private scoreText!: Phaser.GameObjects.Text
  private highScoreText!: Phaser.GameObjects.Text
  private gridContainer!: Phaser.GameObjects.Container
  private isAnimating = false
  private swipeStartX = 0
  private swipeStartY = 0
  private swipeThreshold = 50
  private gameOver = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.initGame()
  }

  private async initGame(): Promise<void> {
    await remix.init()
    
    remix.onPlayAgain(() => {
      this.restartGame()
    })

    this.loadHighScore()
    this.createUI()
    this.createGrid()
    this.setupInput()
    this.spawnTile()
    this.spawnTile()
  }

  private loadHighScore(): void {
    const saved = localStorage.getItem('merge2048_highscore')
    this.highScore = saved ? parseInt(saved, 10) : 0
  }

  private saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score
      localStorage.setItem('merge2048_highscore', this.highScore.toString())
    }
  }

  private createUI(): void {
    // Title
    this.add.text(360, 80, '2048', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '72px',
      color: '#f9f6f2',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Score panel
    const scoreBg = this.add.rectangle(250, 180, 180, 80, 0x2d2d44, 1).setOrigin(0.5)
    scoreBg.setStrokeStyle(2, 0x3d3d5c)
    
    this.add.text(250, 155, 'SCORE', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#8b8b9e'
    }).setOrigin(0.5)

    this.scoreText = this.add.text(250, 190, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // High score panel
    const highScoreBg = this.add.rectangle(470, 180, 180, 80, 0x2d2d44, 1).setOrigin(0.5)
    highScoreBg.setStrokeStyle(2, 0x3d3d5c)
    
    this.add.text(470, 155, 'BEST', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#8b8b9e'
    }).setOrigin(0.5)

    this.highScoreText = this.add.text(470, 190, this.highScore.toString(), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Instructions
    this.add.text(360, 1200, 'Swipe to merge tiles!', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#8b8b9e'
    }).setOrigin(0.5)
  }

  private createGrid(): void {
    const gridWidth = this.gridSize * this.tileSize + (this.gridSize + 1) * this.tileGap
    this.gridX = (720 - gridWidth) / 2
    this.gridY = 300

    this.gridContainer = this.add.container(0, 0)

    // Grid background
    const bgRect = this.add.rectangle(
      this.gridX + gridWidth / 2,
      this.gridY + gridWidth / 2,
      gridWidth,
      gridWidth,
      0x2d2d44,
      1
    )
    bgRect.setStrokeStyle(4, 0x3d3d5c)
    this.gridContainer.add(bgRect)

    // Empty cell backgrounds
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = []
      for (let col = 0; col < this.gridSize; col++) {
        this.grid[row][col] = null
        const { x, y } = this.getCellPosition(row, col)
        const cellBg = this.add.rectangle(x, y, this.tileSize, this.tileSize, 0x3d3d5c, 0.5)
        cellBg.setStrokeStyle(2, 0x4d4d6c)
        this.gridContainer.add(cellBg)
      }
    }
  }

  private getCellPosition(row: number, col: number): { x: number; y: number } {
    const x = this.gridX + this.tileGap + col * (this.tileSize + this.tileGap) + this.tileSize / 2
    const y = this.gridY + this.tileGap + row * (this.tileSize + this.tileGap) + this.tileSize / 2
    return { x, y }
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating || this.gameOver) return
      this.swipeStartX = pointer.x
      this.swipeStartY = pointer.y
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating || this.gameOver) return
      
      const dx = pointer.x - this.swipeStartX
      const dy = pointer.y - this.swipeStartY
      
      if (Math.abs(dx) < this.swipeThreshold && Math.abs(dy) < this.swipeThreshold) {
        return
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          this.move('right')
        } else {
          this.move('left')
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          this.move('down')
        } else {
          this.move('up')
        }
      }
    })

    // Keyboard support for testing
    this.input.keyboard?.on('keydown-LEFT', () => !this.isAnimating && !this.gameOver && this.move('left'))
    this.input.keyboard?.on('keydown-RIGHT', () => !this.isAnimating && !this.gameOver && this.move('right'))
    this.input.keyboard?.on('keydown-UP', () => !this.isAnimating && !this.gameOver && this.move('up'))
    this.input.keyboard?.on('keydown-DOWN', () => !this.isAnimating && !this.gameOver && this.move('down'))
  }

  private createTileSprite(value: number, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    const colors = TILE_COLORS[value] || TILE_COLORS[8192]
    
    const bg = this.add.rectangle(0, 0, this.tileSize, this.tileSize, colors.bg)
    bg.setStrokeStyle(2, 0xffffff, 0.2)
    container.add(bg)

    const fontSize = value >= 1024 ? '36px' : value >= 128 ? '42px' : '52px'
    const text = this.add.text(0, 0, value.toString(), {
      fontFamily: 'Arial Black, Arial',
      fontSize,
      color: colors.text,
      fontStyle: 'bold'
    }).setOrigin(0.5)
    container.add(text)

    return container
  }

  private spawnTile(): void {
    const emptyCells: { row: number; col: number }[] = []
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.grid[row][col]) {
          emptyCells.push({ row, col })
        }
      }
    }

    if (emptyCells.length === 0) return

    const { row, col } = Phaser.Utils.Array.GetRandom(emptyCells)
    const value = Math.random() < 0.9 ? 2 : 4
    const { x, y } = this.getCellPosition(row, col)

    const sprite = this.createTileSprite(value, x, y)
    sprite.setScale(0)
    
    this.grid[row][col] = {
      value,
      sprite,
      row,
      col,
      mergedThisTurn: false
    }

    // Spawn animation
    this.tweens.add({
      targets: sprite,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut'
    })
  }

  private move(direction: 'up' | 'down' | 'left' | 'right'): void {
    this.isAnimating = true
    let moved = false
    let mergeScore = 0

    // Reset merge flags
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col]) {
          this.grid[row][col]!.mergedThisTurn = false
        }
      }
    }

    const vectors: Record<string, { row: number; col: number }> = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 }
    }

    const vector = vectors[direction]
    
    // Determine traversal order
    const rowOrder = direction === 'down' ? [3, 2, 1, 0] : [0, 1, 2, 3]
    const colOrder = direction === 'right' ? [3, 2, 1, 0] : [0, 1, 2, 3]

    const animations: Promise<void>[] = []

    for (const row of rowOrder) {
      for (const col of colOrder) {
        const tile = this.grid[row][col]
        if (!tile) continue

        let newRow = row
        let newCol = col

        // Find furthest position
        while (true) {
          const nextRow = newRow + vector.row
          const nextCol = newCol + vector.col

          if (nextRow < 0 || nextRow >= this.gridSize || 
              nextCol < 0 || nextCol >= this.gridSize) {
            break
          }

          const nextTile = this.grid[nextRow][nextCol]
          
          if (!nextTile) {
            newRow = nextRow
            newCol = nextCol
          } else if (nextTile.value === tile.value && !nextTile.mergedThisTurn && !tile.mergedThisTurn) {
            // Merge
            newRow = nextRow
            newCol = nextCol
            break
          } else {
            break
          }
        }

        if (newRow !== row || newCol !== col) {
          moved = true
          
          const targetTile = this.grid[newRow][newCol]
          const { x: targetX, y: targetY } = this.getCellPosition(newRow, newCol)
          
          // Move animation
          const movePromise = new Promise<void>((resolve) => {
            this.tweens.add({
              targets: tile.sprite,
              x: targetX,
              y: targetY,
              duration: 120,
              ease: 'Cubic.easeOut',
              onComplete: () => resolve()
            })
          })
          animations.push(movePromise)

          // Update grid
          this.grid[row][col] = null

          if (targetTile) {
            // Merge
            const newValue = tile.value * 2
            mergeScore += newValue

            targetTile.value = newValue
            targetTile.mergedThisTurn = true

            // Destroy old sprite after animation
            movePromise.then(() => {
              tile.sprite.destroy()
              
              // Update merged tile appearance
              this.updateTileAppearance(targetTile)
              
              // Merge pop animation
              this.tweens.add({
                targets: targetTile.sprite,
                scale: 1.15,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeOut'
              })

              remix.haptic()
            })
          } else {
            // Move to empty space
            tile.row = newRow
            tile.col = newCol
            this.grid[newRow][newCol] = tile
          }
        }
      }
    }

    Promise.all(animations).then(() => {
      if (moved) {
        this.score += mergeScore
        this.scoreText.setText(this.score.toString())
        this.saveHighScore()
        this.highScoreText.setText(this.highScore.toString())
        
        this.time.delayedCall(50, () => {
          this.spawnTile()
          
          this.time.delayedCall(150, () => {
            this.isAnimating = false
            this.checkGameOver()
          })
        })
      } else {
        this.isAnimating = false
      }
    })
  }

  private updateTileAppearance(tile: Tile): void {
    const colors = TILE_COLORS[tile.value] || TILE_COLORS[8192]
    
    // Update background color
    const bg = tile.sprite.getAt(0) as Phaser.GameObjects.Rectangle
    bg.setFillStyle(colors.bg)
    
    // Update text
    const text = tile.sprite.getAt(1) as Phaser.GameObjects.Text
    text.setText(tile.value.toString())
    text.setColor(colors.text)
    
    const fontSize = tile.value >= 1024 ? '36px' : tile.value >= 128 ? '42px' : '52px'
    text.setFontSize(fontSize)
  }

  private checkGameOver(): void {
    // Check for empty cells
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.grid[row][col]) return
      }
    }

    // Check for possible merges
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const tile = this.grid[row][col]
        if (!tile) continue

        // Check right
        if (col < this.gridSize - 1 && this.grid[row][col + 1]?.value === tile.value) {
          return
        }
        // Check down
        if (row < this.gridSize - 1 && this.grid[row + 1][col]?.value === tile.value) {
          return
        }
      }
    }

    // No moves available
    this.gameOver = true
    this.showGameOver()
  }

  private showGameOver(): void {
    this.saveHighScore()
    remix.gameOver(this.score)

    // Overlay
    const overlay = this.add.rectangle(360, 640, 720, 1280, 0x000000, 0.7)
    overlay.setAlpha(0)

    // Game over panel
    const panel = this.add.container(360, 640)
    panel.setAlpha(0)

    const panelBg = this.add.rectangle(0, 0, 500, 350, 0x2d2d44, 1)
    panelBg.setStrokeStyle(4, 0x3d3d5c)
    panel.add(panelBg)

    const gameOverText = this.add.text(0, -100, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#f65e3b',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    panel.add(gameOverText)

    const finalScoreText = this.add.text(0, -20, `Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff'
    }).setOrigin(0.5)
    panel.add(finalScoreText)

    const isNewBest = this.score >= this.highScore
    if (isNewBest) {
      const newBestText = this.add.text(0, 30, '🏆 NEW BEST!', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#edc22e'
      }).setOrigin(0.5)
      panel.add(newBestText)
    }

    // Play again button
    const button = this.add.rectangle(0, 110, 280, 70, 0xf65e3b, 1)
    button.setStrokeStyle(3, 0xf67c5f)
    button.setInteractive({ useHandCursor: true })
    panel.add(button)

    const buttonText = this.add.text(0, 110, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    panel.add(buttonText)

    button.on('pointerover', () => button.setFillStyle(0xf67c5f))
    button.on('pointerout', () => button.setFillStyle(0xf65e3b))
    button.on('pointerdown', () => this.restartGame())

    // Animate in
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300
    })

    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 300,
      delay: 100
    })
  }

  private restartGame(): void {
    this.scene.restart()
    this.score = 0
    this.gameOver = false
    this.isAnimating = false
    this.grid = []
  }
}
