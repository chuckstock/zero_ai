# WordDuelArenaV2 Oracle Service

A Node.js/TypeScript service that watches for guess reveals on the WordDuelArenaV2 contract, evaluates guesses against target words using Wordle rules, and submits signed feedback.

## Features

- 🔍 **Event Watching**: Listens for `GuessRevealed` events on Sepolia
- 📝 **Wordle Evaluation**: Correct handling of duplicate letters
- ✍️ **ECDSA Signing**: Signs feedback for on-chain verification
- 🔄 **Auto-Submit**: Optionally submits feedback directly to contract
- 🌐 **REST API**: Endpoints for manual operations and debugging

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `RPC_URL` - Sepolia RPC endpoint (Infura/Alchemy)
- `ORACLE_PRIVATE_KEY` - Private key for signing
- `CONTRACT_ADDRESS` - WordDuelArenaV2 contract address

### 3. Build & Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Oracle Service                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Contract   │    │  Evaluator   │    │   Signer     │  │
│  │  Interface   │───▶│  (Wordle)    │───▶│  (ECDSA)     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                       │           │
│         │         ┌──────────────┐              │           │
│         │         │  Word Store  │              │           │
│         │         │   (JSON)     │              │           │
│         │         └──────────────┘              │           │
│         │                ▲                      │           │
│         ▼                │                      ▼           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    REST API                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns service status and oracle address.

### Set Target Word
```bash
POST /rounds/:roundId/word
Content-Type: application/json

{"word": "HELLO"}
```
Sets the secret target word for a round. Must be 5 letters.

### Evaluate Guess
```bash
POST /evaluate
Content-Type: application/json

{
  "roundId": "1",
  "player": "0x...",
  "guessNum": 1,
  "guess": "WORLD"
}
```
Returns signed feedback for a guess. Use this if `AUTO_SUBMIT=false`.

### Get Round Info
```bash
GET /rounds/:roundId
```
Check if a target word is set for a round.

### List Active Rounds
```bash
GET /rounds
```
List all rounds with target words.

## Feedback Format

Feedback is packed as `uint40` (5 bytes), one byte per letter position:

| Value | Meaning | Color |
|-------|---------|-------|
| 0 | Absent | ⬜ Gray |
| 1 | Present (wrong position) | 🟨 Yellow |
| 2 | Correct | 🟩 Green |

Example: Guess "WORLD" vs Target "HELLO"
- W: 0 (absent)
- O: 1 (present, wrong position)
- R: 0 (absent)
- L: 2 (correct)
- D: 0 (absent)

Packed: `0x0001000200` = `16777728`

## Signature Verification

The oracle signs:
```
keccak256(abi.encodePacked(uint256 roundId, address player, uint8 guessNum, uint40 feedback))
```

Contract can verify using `ecrecover` on this hash.

## Workflow

1. **Game Setup**: Admin sets target word via API
   ```bash
   curl -X POST http://localhost:3000/rounds/1/word \
     -H "Content-Type: application/json" \
     -d '{"word":"CRANE"}'
   ```

2. **Player Guesses**: Player submits guess on-chain, contract emits `GuessRevealed`

3. **Oracle Processes**: 
   - Catches event
   - Evaluates guess against target word
   - Signs feedback
   - Submits to contract (if AUTO_SUBMIT=true)

4. **Game Continues**: Contract updates state, player sees feedback

## Development

### Project Structure
```
oracle/
├── src/
│   ├── index.ts      # Main entry point
│   ├── evaluator.ts  # Wordle evaluation logic
│   ├── signer.ts     # ECDSA signing
│   ├── contract.ts   # Contract interaction
│   ├── wordStore.ts  # Target word storage
│   ├── api.ts        # Express API server
│   └── logger.ts     # Winston logging
├── data/
│   └── words.json    # Persisted target words
├── logs/
│   ├── combined.log
│   └── error.log
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Testing Evaluation Logic

```typescript
import { evaluateGuess, packFeedback } from './src/evaluator';

// Test with duplicate letters
const feedback = evaluateGuess('SPEED', 'CREEP');
console.log(feedback); // [0, 0, 2, 2, 0]

const packed = packFeedback(feedback);
console.log(packed.toString(16)); // "0002020000"
```

## Production Considerations

1. **Security**: Keep `ORACLE_PRIVATE_KEY` secure. Use secrets management.
2. **Reliability**: Run multiple instances, implement retry logic.
3. **Monitoring**: Set up alerts for failed submissions.
4. **Database**: Replace JSON file with proper database for production.
5. **Rate Limiting**: Add rate limiting to API endpoints.

## License

MIT
