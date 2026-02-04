// Element types for blocks
export enum Element {
  FIRE = 'fire',
  WATER = 'water',
  ICE = 'ice',
  ELECTRIC = 'electric',
}

// Gravity directions
export enum GravityDirection {
  DOWN = 0,
  LEFT = 90,
  UP = 180,
  RIGHT = 270,
}

// Element colors (glow effects)
export const ELEMENT_COLORS: Record<Element, { primary: number; glow: number }> = {
  [Element.FIRE]: { primary: 0xff4422, glow: 0xff6644 },
  [Element.WATER]: { primary: 0x2266ff, glow: 0x4488ff },
  [Element.ICE]: { primary: 0x88ddff, glow: 0xaaeeff },
  [Element.ELECTRIC]: { primary: 0xffee00, glow: 0xffff66 },
};

// Incompatible element pairs (cause explosions)
export const INCOMPATIBLE_PAIRS: [Element, Element][] = [
  [Element.FIRE, Element.ICE],
  [Element.WATER, Element.ELECTRIC],
];

// Compatible element pairs (give bonuses)
export const COMPATIBLE_PAIRS: [Element, Element][] = [
  [Element.FIRE, Element.FIRE],
  [Element.WATER, Element.WATER],
  [Element.ICE, Element.ICE],
  [Element.ELECTRIC, Element.ELECTRIC],
  [Element.FIRE, Element.ELECTRIC], // Lightning fire!
  [Element.WATER, Element.ICE], // Frozen wave
];

// Block interface
export interface StackBlock {
  sprite: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Rectangle;
  element: Element;
  eyes?: Phaser.GameObjects.Container;
  width: number;
  x: number;
  y: number;
}

// Game state
export interface GameState {
  score: number;
  blocksPlaced: number;
  gravityIndex: number;
  perfectionMeter: number;
  isGoldenBlock: boolean;
  towerAwakening: number; // 0-1, how "awake" the tower is
  consecutivePerfects: number;
}

// Check if two elements are incompatible
export function areIncompatible(e1: Element, e2: Element): boolean {
  return INCOMPATIBLE_PAIRS.some(
    ([a, b]) => (a === e1 && b === e2) || (a === e2 && b === e1)
  );
}

// Check if two elements are compatible (bonus)
export function areCompatible(e1: Element, e2: Element): boolean {
  return COMPATIBLE_PAIRS.some(
    ([a, b]) => (a === e1 && b === e2) || (a === e2 && b === e1)
  );
}

// Get random element
export function getRandomElement(): Element {
  const elements = Object.values(Element);
  return elements[Math.floor(Math.random() * elements.length)];
}

// Get gravity direction from index
export function getGravityDirection(index: number): GravityDirection {
  const directions = [
    GravityDirection.DOWN,
    GravityDirection.LEFT,
    GravityDirection.UP,
    GravityDirection.RIGHT,
  ];
  return directions[index % 4];
}
