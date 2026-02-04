import Phaser from 'phaser'
import { multiplayer } from '../multiplayer-sdk'

export class LobbyScene extends Phaser.Scene {
  private roomCodeText!: Phaser.GameObjects.Text
  private inviteLinkText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text
  private inputText: string = ''
  private inputDisplay!: Phaser.GameObjects.Text
  private isConnecting: boolean = false

  constructor() {
    super({ key: 'LobbyScene' })
  }

  create() {
    const { width, height } = this.scale

    // Check for room code in URL
    const urlParams = new URLSearchParams(window.location.search)
    const roomFromUrl = urlParams.get('room')

    // Title
    this.add.text(width / 2, 120, 'TAP ARENA', {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, 200, 'Multiplayer Demo', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888'
    }).setOrigin(0.5)

    // Status text
    this.statusText = this.add.text(width / 2, 300, '', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcc00'
    }).setOrigin(0.5)

    // CREATE ROOM button
    const createBtn = this.createButton(width / 2, 450, 'CREATE ROOM', () => {
      this.createRoom()
    })

    // Divider
    this.add.text(width / 2, 560, '— OR —', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666'
    }).setOrigin(0.5)

    // JOIN ROOM section
    this.add.text(width / 2, 640, 'Enter Room Code:', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    // Input field background
    const inputBg = this.add.rectangle(width / 2, 720, 320, 70, 0x333333, 1)
      .setStrokeStyle(3, 0x555555)
      .setInteractive()
      .on('pointerdown', () => this.focusInput())

    // Input display
    this.inputDisplay = this.add.text(width / 2, 720, '______', {
      fontSize: '48px',
      fontFamily: 'Courier New, monospace',
      color: '#ffffff',
      letterSpacing: 8
    }).setOrigin(0.5)

    // Virtual keyboard for code entry
    this.createKeyboard(width / 2, 900)

    // JOIN button
    const joinBtn = this.createButton(width / 2, 1120, 'JOIN ROOM', () => {
      this.joinRoom()
    })

    // Room code display (hidden initially)
    this.roomCodeText = this.add.text(width / 2, 300, '', {
      fontSize: '56px',
      fontFamily: 'Courier New, monospace',
      color: '#00ff88'
    }).setOrigin(0.5).setVisible(false)

    // Invite link (hidden initially)
    this.inviteLinkText = this.add.text(width / 2, 380, '', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
      wordWrap: { width: 600 }
    }).setOrigin(0.5).setVisible(false)

    // Setup multiplayer event listeners
    this.setupMultiplayerEvents()

    // If room code in URL, auto-join
    if (roomFromUrl) {
      this.inputText = roomFromUrl.toUpperCase().substring(0, 6)
      this.updateInputDisplay()
      this.joinRoom()
    }

    // Keyboard input for desktop
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isConnecting) return
      
      if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1)
        this.updateInputDisplay()
      } else if (event.key === 'Enter' && this.inputText.length === 6) {
        this.joinRoom()
      } else if (/^[A-Za-z0-9]$/.test(event.key) && this.inputText.length < 6) {
        this.inputText += event.key.toUpperCase()
        this.updateInputDisplay()
      }
    })
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 400, 80, 0x4a4ae8, 1)
      .setStrokeStyle(3, 0x6a6aff)
    
    const label = this.add.text(0, 0, text, {
      fontSize: '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5)

    const container = this.add.container(x, y, [bg, label])
    
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x5a5af8))
      .on('pointerout', () => bg.setFillStyle(0x4a4ae8))
      .on('pointerdown', () => {
        bg.setFillStyle(0x3a3ad8)
        callback()
      })
      .on('pointerup', () => bg.setFillStyle(0x5a5af8))

    return container
  }

  private createKeyboard(x: number, y: number) {
    const keys = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ]

    const keySize = 58
    const keyGap = 8
    const startY = y - (keys.length * (keySize + keyGap)) / 2

    keys.forEach((row, rowIndex) => {
      const rowWidth = row.length * (keySize + keyGap) - keyGap
      const startX = x - rowWidth / 2

      row.forEach((key, keyIndex) => {
        const keyX = startX + keyIndex * (keySize + keyGap) + keySize / 2
        const keyY = startY + rowIndex * (keySize + keyGap)

        const keyBg = this.add.rectangle(keyX, keyY, keySize, keySize, 0x444444, 1)
          .setStrokeStyle(2, 0x666666)
          .setInteractive({ useHandCursor: true })

        const keyLabel = this.add.text(keyX, keyY, key, {
          fontSize: '28px',
          fontFamily: 'Arial, sans-serif',
          color: '#ffffff'
        }).setOrigin(0.5)

        keyBg.on('pointerdown', () => {
          if (this.isConnecting) return
          
          keyBg.setFillStyle(0x666666)
          
          if (key === '⌫') {
            this.inputText = this.inputText.slice(0, -1)
          } else if (this.inputText.length < 6) {
            this.inputText += key
          }
          this.updateInputDisplay()
        })
        
        keyBg.on('pointerup', () => keyBg.setFillStyle(0x444444))
        keyBg.on('pointerout', () => keyBg.setFillStyle(0x444444))
      })
    })
  }

  private updateInputDisplay() {
    const display = this.inputText.padEnd(6, '_').split('').join(' ')
    this.inputDisplay.setText(display)
  }

  private focusInput() {
    // On mobile, we use the virtual keyboard
    // On desktop, the keyboard listener handles it
  }

  private setupMultiplayerEvents() {
    multiplayer.on('connected', (data: { roomId: string }) => {
      this.statusText.setText('Connected!')
      this.roomCodeText.setText(`Room: ${data.roomId}`).setVisible(true)
      this.inviteLinkText.setText(`Share: ${multiplayer.getInviteLink()}`).setVisible(true)
      
      // Transition to game after short delay
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene')
      })
    })

    multiplayer.on('error', () => {
      this.isConnecting = false
      this.statusText.setText('Connection failed. Try again.')
    })

    multiplayer.on('disconnected', () => {
      this.isConnecting = false
    })
  }

  private async createRoom() {
    if (this.isConnecting) return
    this.isConnecting = true
    this.statusText.setText('Creating room...')

    try {
      await multiplayer.connect('')  // Empty string = generate new room
    } catch (error) {
      this.isConnecting = false
      this.statusText.setText('Failed to create room')
      console.error('Create room error:', error)
    }
  }

  private async joinRoom() {
    if (this.isConnecting) return
    if (this.inputText.length !== 6) {
      this.statusText.setText('Enter 6-character code')
      return
    }

    this.isConnecting = true
    this.statusText.setText('Joining room...')

    try {
      await multiplayer.connect(this.inputText)
    } catch (error) {
      this.isConnecting = false
      this.statusText.setText('Failed to join room')
      console.error('Join room error:', error)
    }
  }
}
