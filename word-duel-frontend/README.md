# Word Duel Frontend

A PvP word guessing game built on Base. Mobile-first React/TypeScript app with real-time WebSocket gameplay.

## Features

- 🎮 **Real-time PvP** - Compete head-to-head with turn timers
- 💰 **Stake ETH** - Wager on games, winner takes the pot
- 📱 **Mobile-first** - Responsive design, touch-friendly keyboard
- 🔗 **Web3 Native** - Connect with MetaMask, Coinbase Wallet, or WalletConnect
- 🎨 **Wordle-inspired UI** - Familiar mechanics with a competitive twist
- 🏆 **Leaderboards** - Track your stats and climb the ranks

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State:** Zustand
- **Web3:** wagmi + viem
- **Real-time:** WebSocket

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A WalletConnect project ID (get one at https://cloud.walletconnect.com)

### Installation

```bash
# Clone the repo
cd word-duel-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your WalletConnect project ID to .env
# VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# Start development server
npm run dev
```

The app will be available at http://localhost:3000

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/       # React components
│   ├── Home/        # Landing page
│   ├── Lobby/       # Game creation/joining
│   ├── Game/        # Main gameplay
│   ├── Results/     # Win/lose screen
│   ├── Leaderboard/ # Rankings
│   └── shared/      # Reusable components
├── hooks/           # Custom React hooks
│   ├── useWebSocket.ts
│   ├── useGameTimer.ts
│   ├── useKeyboard.ts
│   ├── useConfetti.ts
│   └── useSound.ts
├── stores/          # Zustand state stores
│   ├── gameStore.ts
│   ├── userStore.ts
│   ├── lobbyStore.ts
│   ├── settingsStore.ts
│   └── toastStore.ts
├── lib/             # Configuration
│   ├── wagmi.ts     # Web3 config
│   └── constants.ts # App constants
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## Game Flow

1. **Connect Wallet** - Connect your Base wallet
2. **Create/Join Game** - Set wager and find opponent
3. **Countdown** - 3-second countdown before start
4. **Play** - 30-second turns, guess the 5-letter word
5. **Win/Lose** - First to solve wins the pot

## WebSocket Protocol

The frontend communicates with the backend via WebSocket messages:

```typescript
// Client → Server
{ type: 'join_queue', payload: { address, wager } }
{ type: 'leave_queue', payload: { address } }
{ type: 'create_game', payload: { address, wager } }
{ type: 'join_game', payload: { gameId, address } }
{ type: 'submit_guess', payload: { gameId, address, guess } }

// Server → Client
{ type: 'queue_update', payload: { position, size, status } }
{ type: 'game_start', payload: GameState }
{ type: 'game_update', payload: GameState }
{ type: 'opponent_progress', payload: OpponentBoard }
{ type: 'turn_update', payload: { timeRemaining, currentTurn } }
{ type: 'game_end', payload: GameState }
{ type: 'error', payload: { message } }
```

## Customization

### Adding Sound Effects

Place MP3 files in `public/sounds/`:
- `correct.mp3` - Correct letter
- `present.mp3` - Letter in wrong position
- `absent.mp3` - Letter not in word
- `win.mp3` - Victory sound
- `lose.mp3` - Defeat sound
- `tick.mp3` - Timer tick (last 10 seconds)
- `submit.mp3` - Guess submitted
- `invalid.mp3` - Invalid word

### Changing Colors

Edit `tailwind.config.js`:
```javascript
colors: {
  'tile-correct': '#538d4e',   // Green
  'tile-present': '#b59f3b',   // Yellow
  'tile-absent': '#3a3a3c',    // Gray
  // ...
}
```

## License

MIT
