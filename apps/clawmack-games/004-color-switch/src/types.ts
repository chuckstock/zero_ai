// Color definitions for the game
export interface ColorDef {
  name: string;
  hex: number;
  rgb: { r: number; g: number; b: number };
}

export const GAME_COLORS: ColorDef[] = [
  { name: 'cyan', hex: 0x00ffff, rgb: { r: 0, g: 255, b: 255 } },
  { name: 'magenta', hex: 0xff00ff, rgb: { r: 255, g: 0, b: 255 } },
  { name: 'yellow', hex: 0xffff00, rgb: { r: 255, g: 255, b: 0 } },
  { name: 'lime', hex: 0x00ff00, rgb: { r: 0, g: 255, b: 0 } }
];

export const GRAY_COLOR: ColorDef = {
  name: 'gray',
  hex: 0x333333,
  rgb: { r: 51, g: 51, b: 51 }
};

// Corruption levels based on score
export enum CorruptionLevel {
  NONE = 0,      // Score 0-9
  SUBTLE = 1,    // Score 10-19
  BREAKING = 2,  // Score 20-29
  FULL = 3       // Score 30+
}

export interface ObstacleSegment {
  graphics: Phaser.GameObjects.Graphics;
  colorIndex: number;
  startAngle: number;
  endAngle: number;
  isCorrupted?: boolean;
  displayColorIndex?: number; // For lying colors
}

export interface Obstacle {
  container: Phaser.GameObjects.Container;
  segments: ObstacleSegment[];
  type: 'ring' | 'cross' | 'square' | 'bars';
  y: number;
  rotationSpeed: number;
  passed: boolean;
}

export interface ColorStar {
  graphics: Phaser.GameObjects.Graphics;
  y: number;
  colorIndex: number;
  collected: boolean;
  pulsePhase: number;
}

// Beat timing constants
export const BPM = 120;
export const BEAT_INTERVAL = 60000 / BPM; // ms per beat
export const BEAT_WINDOW = 150; // ms window for "on beat" detection

// Game constants
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const BALL_RADIUS = 15;
export const GRAVITY = 800;
export const JUMP_VELOCITY = -400;
export const SCROLL_SPEED = 2;
export const COLOR_DECAY_RATE = 0.015; // Per frame color decay
export const COLOR_REFRESH_AMOUNT = 1.0; // Full refresh on star collect
