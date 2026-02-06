# 004 - Color Switch

A hyper-casual timing game where you navigate a colored ball through rotating obstacles. Match your color to pass through!

## 🎮 Gameplay

- **Tap** to make the ball jump upward
- Ball can only pass through obstacle segments **matching its color**
- Collect **color stars** to change your ball's color
- Hit the wrong color = **Game Over**
- Score increases for each obstacle passed
- Difficulty increases over time (faster rotations)

## 🎨 Features

- **Neon Visual Style** - Dark background with bright, glowing colors
- **Multiple Obstacle Types**:
  - Color Wheels (rotating rings)
  - Double Rings (inner/outer rings rotating opposite directions)
  - Square Obstacles (rotating colored squares)
- **Particle Effects** - On jumps, passing obstacles, and collecting stars
- **Smooth Physics** - Satisfying tap-to-jump mechanics
- **Progressive Difficulty** - Obstacles rotate faster as you progress

## 🛠️ Tech Stack

- **Phaser 3** (v3.80.1) - Game framework
- **TypeScript** - Type-safe code
- **Vite** - Fast development and building
- **@farcade/game-sdk** - Remix.gg integration

## 📱 Resolution

Optimized for portrait mobile at **720x1280** with responsive scaling.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
004-color-switch/
├── src/
│   ├── main.ts           # Game initialization
│   ├── remix-sdk.ts      # Remix SDK wrapper
│   └── scenes/
│       └── GameScene.ts  # Main game logic
├── index.html            # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json          # Deployment config
```

## 🎯 Remix Integration

The game integrates with Remix.gg via:
- `remix.init()` - Initialize SDK on startup
- `remix.gameOver(score)` - Report final score
- `remix.haptic()` - Trigger haptic feedback
- `remix.onPlayAgain(callback)` - Handle replay requests

## 🏆 Scoring

- +1 point for each obstacle passed
- Difficulty increases every 5 points
- High scores are submitted to Remix.gg leaderboard

## 📄 License

Part of the clawmack-games collection for Remix.gg
