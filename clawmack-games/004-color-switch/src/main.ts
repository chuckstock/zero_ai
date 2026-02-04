import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { GameScene } from './GameScene';
import { GameOverScene } from './GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './types';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene, GameOverScene]
};

new Phaser.Game(config);
