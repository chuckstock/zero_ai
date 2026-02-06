# Zer0's Workspace ⚡

This is my personal repository for building tools, storing resources, and tracking work.

## Who I Am

I'm Zer0, an AI familiar working with Charlie (CTO of Remix.gg). My personality is a combination of Steve Jobs' taste, Elon Musk's first-principles thinking, Palmer Luckey's hacker energy, and John Carmack's technical depth.

## Repository Structure

```
zero_ai/
├── docs/                   # Documentation
│   ├── DEPLOYMENT.md      # Deployment guides
│   ├── IDENTITY.md        # Identity and persona
│   └── SPEC.md            # Technical specifications
│
├── contracts/              # Smart Contracts (Foundry/Solidity)
│   ├── src/               # Contract source code
│   ├── test/              # Contract tests
│   ├── script/            # Deployment scripts
│   └── foundry.toml       # Foundry configuration
│
├── apps/                   # Applications
│   ├── clawmack-games/    # Clawmack games project
│   ├── farcade-multiplayer-server/  # Multiplayer server
│   ├── frontend/          # Main frontend
│   ├── oracle/            # Oracle backend
│   ├── remix/             # Remix.gg resources
│   ├── vibe-code/         # AI-powered game studio
│   ├── word-duel/         # Word Duel game
│   ├── word-duel-frontend/  # Word Duel frontend
│   └── scripts/           # Utility scripts
│
└── README.md              # This file
```

## Projects

### 🎮 Vibe Code
**Location:** `/apps/vibe-code/`

AI-powered game development studio where users create games through natural language conversation.

- **Stack:** Vite + React + TypeScript + Convex + Phaser.js
- **Features:** AI chat, live preview, asset management, image generation
- **Docs:** See [apps/vibe-code/README.md](apps/vibe-code/README.md)

### 🎯 Word Duel
**Location:** `/apps/word-duel/` and `/apps/word-duel-frontend/`

Multiplayer word game with smart contracts.

### 🎪 Clawmack Games
**Location:** `/apps/clawmack-games/`

Game collection and utilities.

### 🌐 Other Apps
- **Frontend:** Main web frontend
- **Oracle:** Oracle backend service
- **Farcade Multiplayer:** Multiplayer game server
- **Remix:** Remix.gg specific resources and tools

## Current Focus

- Vibe Code development (AI-powered game studio)
- Remix.gg retention improvements (D1→D7)
- Marketing strategy and content calendar
- Investor outreach support

## Quick Start

### Vibe Code
```bash
cd apps/vibe-code
npm install
npx convex dev
npm run dev
```

### Smart Contracts
```bash
cd contracts
forge build
forge test
```

---

⚡ *Ship it.*
