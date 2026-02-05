# Word Duel Arena ⚔️

A multiplayer Wordle-style word guessing game on Ethereum (Sepolia testnet).

![Word Duel Arena](https://img.shields.io/badge/Ethereum-Sepolia-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## 🎮 Game Overview

Word Duel Arena is a competitive word guessing game where players compete to solve a secret 5-letter word. All players guess simultaneously, with their guesses committed to the blockchain using a commit-reveal scheme for fairness.

### Tiers
| Tier | Entry Fee | Description |
|------|-----------|-------------|
| 🏃 Sprint | 0.001 ETH | Quick games, low stakes |
| ⚖️ Standard | 0.01 ETH | Balanced gameplay |
| 💎 HighRoller | 0.1 ETH | High stakes competition |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## 🎯 How to Play

1. **Connect Wallet** - Click "Connect" and select your wallet
2. **Join a Round** - Browse active rounds in the lobby and click "Join"
3. **Make Your Guess** - During commit phase, type a 5-letter word and press ENTER
4. **Reveal** - When reveal phase starts, click "Reveal" to submit your guess
5. **Wait for Results** - Oracle validates guesses and provides feedback
6. **Repeat** - Up to 6 guesses to solve the word
7. **Claim Prize** - Winners split the pot!

### Game Phases

- **⏳ Waiting** - Round hasn't started, players can register
- **🟢 Commit** - Type and submit your guess (hashed on-chain)
- **🟡 Reveal** - Reveal your committed guess for validation
- **⏸️ Judging** - Oracle processes guesses and provides feedback
- **🏁 Complete** - Winners can claim their share of the pot

## 🔧 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Web3**: wagmi v2 + viem
- **Styling**: Tailwind CSS
- **Network**: Sepolia Testnet

## 📜 Smart Contract

**Address**: `0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443`

[View on Etherscan](https://sepolia.etherscan.io/address/0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443)

### Key Functions

| Function | Description |
|----------|-------------|
| `register(roundId)` | Join a round (payable) |
| `commitGuess(roundId, commitment)` | Submit hashed guess |
| `revealGuess(roundId, guess, salt, proof[])` | Reveal your guess |
| `claimPrize(roundId)` | Claim winnings |

## 🎨 Features

- 🌙 Dark theme with Wordle-inspired aesthetics
- ⌨️ On-screen keyboard with letter status tracking
- ⏱️ Real-time phase timers
- 🔐 Commit-reveal scheme for fair play
- 💰 Prize pool tracking
- 📱 Responsive design

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx      # Wallet connection
│   │   ├── Lobby.tsx       # Round selection
│   │   ├── Game.tsx        # Main gameplay
│   │   └── Results.tsx     # Winners & claiming
│   ├── config/
│   │   ├── wagmi.ts        # Web3 config
│   │   └── abi.ts          # Contract ABI
│   ├── hooks/
│   │   └── useWordDuel.ts  # Contract interactions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Tailwind + custom styles
├── index.html
└── README.md
```

## 🛠️ Development

### Environment Variables

No environment variables required for basic setup. The app connects to Sepolia via public RPCs.

For custom RPC:
```env
VITE_RPC_URL=https://your-sepolia-rpc.com
```

### Testing Locally

1. Get Sepolia ETH from a faucet
2. Connect MetaMask to Sepolia network
3. Join a round and play!

## 📄 License

MIT

---

Built with ⚔️ for Web3 gaming
