# Tap Stack Chaos 🗼⚡🔥❄️💧

A twisted take on the classic stacking game where your tower is alive, gravity betrays you, and elements clash!

## 🎮 Core Gameplay
Tap to drop blocks and build your tower. The goal is simple: stack as high as possible. But nothing stays simple for long...

## 🌀 The Twists

### 1. Gravity Chaos
Every **5 blocks**, gravity direction changes: down → left → up → right → down. Your tower builds in a spiral as the camera smoothly rotates to follow. Adapt or collapse!

### 2. Elemental Blocks
Blocks have one of four elements:
- 🔥 **Fire** (red-orange glow)
- 💧 **Water** (blue glow)  
- ❄️ **Ice** (cyan glow)
- ⚡ **Electric** (yellow glow)

**Incompatible pairs cause explosions:**
- Fire + Ice = 💥 Tower shakes, lose points!
- Water + Electric = 💥 Elemental clash!

**Compatible combos give bonuses:**
- Same elements stack = Elemental surge bonus!
- Fire + Electric = Lightning fire!
- Water + Ice = Frozen wave!

### 3. Living Tower
Your tower **breathes and sways** subtly. As your score climbs past 15 blocks, the tower starts to "wake up":
- 👀 Eyes appear on some blocks
- Pupils follow your moving block
- Tower sways more, making timing trickier
- Blocks blink randomly

The higher you go, the more alive (and resistant) your tower becomes!

### 4. Perfectionist's Curse
Perfect placements (within 8px) build a **Perfection Meter**:
- 4 perfects fill the meter
- Full meter = **GOLDEN BLOCK** incoming!
- Golden blocks are **twice as fast** but worth 50 bonus points
- **Miss the golden block = lose 3 blocks!** (The curse strikes)

Risk vs reward: Do you chase perfection or play it safe?

## 🎨 Visual Style
- Dark atmospheric theme (deep purple-black)
- Elemental glow effects on every block
- Floating ambient particles
- Smooth camera rotations during gravity shifts
- Dramatic explosion particles on elemental clashes
- Pulsing golden blocks

## 🛠 Tech Stack
- **Phaser 3.80.1** - Game framework
- **TypeScript** - Type-safe code
- **Vite** - Build tool
- **@farcade/game-sdk** - Farcade platform integration

## 📁 Project Structure
```
002-tap-stack/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts           # Game config & initialization
    ├── types.ts          # Element types, interfaces, helpers
    └── scenes/
        ├── BootScene.ts     # Loading & SDK init
        ├── GameScene.ts     # Main gameplay (800+ lines!)
        └── GameOverScene.ts # Score display & restart
```

## 🚀 Development
```bash
npm install
npm run dev
```

## 📦 Build
```bash
npm run build
```

## 🎯 Scoring
- Standard placement: 10 points
- Perfect placement: 15 points
- Golden block perfect: 50 points
- Elemental combo bonus: +5 points
- Elemental clash: -5 points

---
*Built for the Farcade platform - TikTok for games! 🎮*
