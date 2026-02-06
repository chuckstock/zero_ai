import Phaser from 'phaser'
import { LobbyScene } from './scenes/LobbyScene'
import { GameScene } from './scenes/GameScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [LobbyScene, GameScene],
  input: {
    activePointers: 3
  }
}

new Phaser.Game(config)
