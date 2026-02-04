import Phaser from 'phaser'
import { multiplayer, PlayerState } from '../multiplayer-sdk'

// Bright colors for players
const PLAYER_COLORS = [
  0xff6b6b, // Red
  0x4ecdc4, // Teal
  0xffe66d, // Yellow
  0x95e1d3, // Mint
  0xf38181, // Coral
  0xaa96da, // Purple
  0xfcbad3, // Pink
  0xa8d8ea, // Light blue
  0xff9a3c, // Orange
  0x1fab89, // Green
]

interface PlayerSprite {
  container: Phaser.GameObjects.Container
  circle: Phaser.GameObjects.Arc
  glow: Phaser.GameObjects.Arc
  nameText: Phaser.GameObjects.Text
}

export class GameScene extends Phaser.Scene {
  private localPlayer!: PlayerSprite
  private remotePlayers: Map<string, PlayerSprite> = new Map()
  private playerColor: number = 0
  private roomCodeText!: Phaser.GameObjects.Text
  private playerCountText!: Phaser.GameObjects.Text
  private leaveButton!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    const { width, height } = this.scale

    // Random color for local player
    this.playerColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]

    // Create local player at center
    this.localPlayer = this.createPlayerSprite(
      width / 2,
      height / 2,
      this.playerColor,
      'YOU'
    )

    // Send initial position
    multiplayer.send('join', {
      x: width / 2,
      y: height / 2,
      color: this.playerColor,
      name: multiplayer.playerId.substring(0, 6)
    })

    // UI Elements
    this.roomCodeText = this.add.text(20, 20, `Room: ${multiplayer.roomId}`, {
      fontSize: '28px',
      fontFamily: 'Courier New, monospace',
      color: '#00ff88',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100)

    this.playerCountText = this.add.text(20, 70, 'Players: 1', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100)

    // Leave button
    this.createLeaveButton()

    // Instructions
    this.add.text(width / 2, height - 60, 'Tap anywhere to move', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

    // Input handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore if clicking leave button area
      if (pointer.x > this.scale.width - 120 && pointer.y < 80) return
      
      this.moveLocalPlayer(pointer.x, pointer.y)
    })

    // Setup multiplayer event listeners
    this.setupMultiplayerEvents()

    // Sync existing players
    this.syncExistingPlayers()

    // Update player count
    this.updatePlayerCount()
  }

  private createPlayerSprite(x: number, y: number, color: number, name: string): PlayerSprite {
    // Glow effect (larger, semi-transparent)
    const glow = this.add.circle(0, 0, 45, color, 0.3)

    // Main circle
    const circle = this.add.circle(0, 0, 30, color, 1)
      .setStrokeStyle(3, 0xffffff, 0.5)

    // Name text above
    const nameText = this.add.text(0, -55, name, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // Container for all parts
    const container = this.add.container(x, y, [glow, circle, nameText])

    // Pulse animation for glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.5 },
      scale: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    return { container, circle, glow, nameText }
  }

  private moveLocalPlayer(targetX: number, targetY: number) {
    // Clamp to game bounds with padding
    const padding = 40
    targetX = Phaser.Math.Clamp(targetX, padding, this.scale.width - padding)
    targetY = Phaser.Math.Clamp(targetY, padding, this.scale.height - padding)

    // Tween to new position
    this.tweens.add({
      targets: this.localPlayer.container,
      x: targetX,
      y: targetY,
      duration: 100,
      ease: 'Power2'
    })

    // Send position to server
    multiplayer.send('move', {
      x: targetX,
      y: targetY
    })
  }

  private setupMultiplayerEvents() {
    // New player joined
    multiplayer.on('player_joined', (data: PlayerState) => {
      console.log('[Game] Player joined:', data.id)
      this.addRemotePlayer(data)
      this.updatePlayerCount()
    })

    // Player left
    multiplayer.on('player_left', (data: { id: string }) => {
      console.log('[Game] Player left:', data.id)
      this.removeRemotePlayer(data.id)
      this.updatePlayerCount()
    })

    // Player moved
    multiplayer.on('move', (data: { id: string; x: number; y: number }) => {
      this.moveRemotePlayer(data.id, data.x, data.y)
    })

    // Full room state sync
    multiplayer.on('room_state', (data: { players: PlayerState[] }) => {
      console.log('[Game] Room state:', data.players?.length || 0, 'players')
      this.syncExistingPlayers()
      this.updatePlayerCount()
    })

    // Disconnected
    multiplayer.on('disconnected', () => {
      this.scene.start('LobbyScene')
    })
  }

  private syncExistingPlayers() {
    // Add sprites for any players we don't have yet
    multiplayer.players.forEach((playerState, playerId) => {
      if (!this.remotePlayers.has(playerId)) {
        this.addRemotePlayer(playerState)
      }
    })
  }

  private addRemotePlayer(data: PlayerState) {
    if (this.remotePlayers.has(data.id)) return

    const color = data.color || PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
    const name = data.name || data.id.substring(0, 6)
    
    const sprite = this.createPlayerSprite(
      data.x || this.scale.width / 2,
      data.y || this.scale.height / 2,
      color,
      name
    )

    // Fade in animation
    sprite.container.setAlpha(0)
    this.tweens.add({
      targets: sprite.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    })

    this.remotePlayers.set(data.id, sprite)
  }

  private removeRemotePlayer(playerId: string) {
    const sprite = this.remotePlayers.get(playerId)
    if (sprite) {
      // Fade out and destroy
      this.tweens.add({
        targets: sprite.container,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          sprite.container.destroy()
        }
      })
      this.remotePlayers.delete(playerId)
    }
  }

  private moveRemotePlayer(playerId: string, x: number, y: number) {
    const sprite = this.remotePlayers.get(playerId)
    if (sprite) {
      this.tweens.add({
        targets: sprite.container,
        x: x,
        y: y,
        duration: 100,
        ease: 'Power2'
      })
    }
  }

  private updatePlayerCount() {
    const count = 1 + this.remotePlayers.size
    this.playerCountText.setText(`Players: ${count}`)
  }

  private createLeaveButton() {
    const x = this.scale.width - 70
    const y = 40

    const bg = this.add.rectangle(0, 0, 100, 50, 0xff4444, 1)
      .setStrokeStyle(2, 0xff6666)

    const text = this.add.text(0, 0, 'LEAVE', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.leaveButton = this.add.container(x, y, [bg, text])
      .setScrollFactor(0)
      .setDepth(100)

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0xff6666))
      .on('pointerout', () => bg.setFillStyle(0xff4444))
      .on('pointerdown', () => {
        multiplayer.disconnect()
        this.scene.start('LobbyScene')
      })
  }

  shutdown() {
    // Clean up remote player sprites
    this.remotePlayers.forEach(sprite => {
      sprite.container.destroy()
    })
    this.remotePlayers.clear()
  }
}
