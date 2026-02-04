# 2048 Merge

A hyper-casual implementation of the classic 2048 number puzzle game, built for Remix.gg.

## 🎮 Gameplay

- **4x4 grid** with sliding tiles
- **Swipe** in any direction to move all tiles
- **Matching numbers merge** (2+2=4, 4+4=8, etc.)
- **New tile spawns** (2 or 4) after each move
- **Goal:** Reach 2048... or keep going!
- **Game ends** when no moves are possible
- **Score:** Sum of all merged tile values

## ✨ Features

- Smooth tile sliding animations
- Satisfying merge pop effects
- Color-coded tiles by value
- Dark theme with vibrant tile colors
- Swipe gesture detection
- Keyboard support (arrow keys)
- High score persistence
- Remix SDK integration

## 🛠 Tech Stack

- **Phaser 3** (v3.80.1) - Game framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **@farcade/game-sdk** - Remix integration

## 📐 Resolution

- 720x1280 (portrait)
- Auto-scaling with FIT mode

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Color Palette

| Value | Color |
|-------|-------|
| 2 | Cream |
| 4 | Tan |
| 8 | Orange |
| 16 | Dark Orange |
| 32 | Red-Orange |
| 64 | Red |
| 128+ | Gold gradient |
| 2048 | Bright Gold |

## 📁 Project Structure

```
003-merge-2048/
├── src/
│   ├── main.ts          # Game configuration & entry
│   ├── remix-sdk.ts     # Remix SDK wrapper
│   └── scenes/
│       └── GameScene.ts # Main game logic
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
└── README.md
```

## 🎯 Controls

- **Mobile:** Swipe in any direction
- **Desktop:** Arrow keys

## 🏆 Scoring

Every merge adds the resulting value to your score:
- 2+2=4 → +4 points
- 4+4=8 → +8 points
- etc.

High scores are saved locally.

---

Built with ❤️ for Remix.gg
