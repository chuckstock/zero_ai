# Word Duel Arena - Technical Specification

## Overview

Word Duel Arena is a multiplayer word-guessing game where all players compete simultaneously on the same word. Uses commit-reveal mechanics to ensure fairness - no one can gain advantage from info sharing or seeing others' guesses early.

## Game Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROUND LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REGISTRATION (open until round starts)                      │
│     └─ Players pay entry fee to join                            │
│                                                                 │
│  2. ROUND START                                                 │
│     └─ Word hash published (keccak256 of word + salt)           │
│                                                                 │
│  3. GUESS ROUNDS (repeat up to 6x)                              │
│     ├─ COMMIT PHASE (30-60 sec)                                 │
│     │   └─ All players submit hash(guess + player_salt)         │
│     ├─ REVEAL PHASE (30-60 sec)                                 │
│     │   └─ All players reveal guess + salt                      │
│     └─ EVALUATION                                               │
│         └─ Contract evaluates all guesses, publishes results    │
│                                                                 │
│  4. ROUND END                                                   │
│     ├─ Word revealed                                            │
│     ├─ Winners determined (first to solve)                      │
│     └─ Pot distributed                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Timing

### Round Cadences

| Tier | Frequency | Entry Fee | Commit Window | Reveal Window |
|------|-----------|-----------|---------------|---------------|
| Sprint | Every 15 min | 0.001 ETH | 30 sec | 30 sec |
| Standard | Every hour | 0.01 ETH | 45 sec | 45 sec |
| High Roller | Every 6 hours | 0.1 ETH | 60 sec | 60 sec |

### Phase Timing per Guess Round
- Commit phase: Players must submit their guess commitment
- Reveal phase: Players must reveal their actual guess
- Missing a deadline = skipped turn (but still in game)

## Scoring & Winning

### Primary Rule: First to Solve
- Player(s) who solve in the fewest guesses win
- If multiple players solve on the same guess number → split pot equally

### Tiebreaker Options (configurable)
1. **Equal split** (default) - All winners split equally
2. **Commit timestamp** - Earlier commit wins (rewards speed)
3. **Proportional by streak** - Bonus for consecutive round wins

### Pot Distribution
- Winners split: 95% of pot
- Protocol fee: 5% of pot
- If no winner (no one solves in 6): Rollover to next round

## Smart Contract Architecture

### Core Contracts

```
WordDuelArena.sol       - Main game logic
├── RoundManager.sol    - Handles round lifecycle & timing
├── CommitReveal.sol    - Commit-reveal mechanics
├── WordVerifier.sol    - Word validation (Merkle proof)
└── FeeVault.sol        - Fee collection & distribution
```

### Key Data Structures

```solidity
struct Round {
    uint256 id;
    bytes32 wordHash;           // keccak256(word || salt)
    bytes32 wordSalt;           // revealed at end
    bytes5 word;                // revealed at end
    
    uint256 entryFee;
    uint256 pot;
    uint256 startTime;
    uint256 playerCount;
    
    RoundPhase phase;
    uint8 currentGuess;         // 1-6
    
    address[] players;
    address[] winners;
    uint8 winningGuessNum;      // which guess # won (1-6)
}

struct PlayerState {
    bool registered;
    bool eliminated;            // missed reveal deadline
    uint8 solvedAtGuess;        // 0 = not solved, 1-6 = solved
    bytes32[6] commitments;     // hash of each guess
    bytes5[6] guesses;          // revealed guesses
    uint8[6] scores;            // green count per guess
}

enum RoundPhase {
    Registration,
    Commit,
    Reveal,
    Evaluation,
    Complete
}
```

### Key Functions

```solidity
// Player actions
function register(uint256 roundId) external payable;
function commitGuess(uint256 roundId, bytes32 commitment) external;
function revealGuess(uint256 roundId, bytes5 guess, bytes32 salt) external;

// Automation (called by keeper or anyone)
function advancePhase(uint256 roundId) external;
function evaluateGuesses(uint256 roundId) external;
function finalizeRound(uint256 roundId) external;

// Views
function getRound(uint256 roundId) external view returns (Round memory);
function getPlayerState(uint256 roundId, address player) external view returns (PlayerState memory);
function getCurrentRound(Tier tier) external view returns (uint256);
```

## Word Selection

### On-chain Randomness
- Use block hash + round ID + secret salt for word selection
- Word index = hash % wordListLength
- Salt revealed only after round complete

### Word List
- Same Merkle tree approach as before
- ~2000 common 5-letter words
- Players can verify word was in list via Merkle proof

## Evaluation Logic

### Guess Scoring (per letter)
- 🟩 Correct position = "correct"
- 🟨 Wrong position = "present"  
- ⬛ Not in word = "absent"

### On-chain Evaluation
```solidity
function evaluateGuess(bytes5 guess, bytes5 target) 
    internal pure returns (uint8 correctCount, uint8[5] memory results) 
{
    // results[i]: 0=absent, 1=present, 2=correct
    // correctCount: number of green tiles (for quick win check)
}
```

### Win Condition
- `correctCount == 5` → Player solved
- First player(s) to solve (by guess number) win the round

## Anti-Cheat Mechanisms

### Commit-Reveal
- Can't see others' guesses until you've committed
- Can't change guess after seeing results
- Commitment: `keccak256(abi.encodePacked(guess, playerSalt))`

### Timing Enforcement
- Strict phase deadlines enforced by contract
- Missing commit = skip that guess
- Missing reveal = guess doesn't count (as if skipped)

### No Early Information
- Word hash published at round start (can't be reverse-engineered)
- Actual word only revealed after round complete
- All players see results simultaneously after reveal phase

## Edge Cases

### Player Misses Deadline
- **Missed commit**: Player skips that guess round, still in game
- **Missed reveal**: Same as missed commit (guess doesn't count)
- **Missed multiple**: Can still win if they solve later

### No One Solves
- Pot rolls over to next round of same tier
- Or: refund entry fees (configurable)

### Only One Player
- Game still runs (player vs the word)
- If they solve: win full pot (minus fee)
- If they fail: pot rolls over

### Round Abandoned
- If 0 players: no round happens
- If all players miss all deadlines: refund

## Frontend Requirements

### Real-time Updates
- WebSocket for phase changes
- Countdown timers for commit/reveal windows
- Live player count and pot size

### Game View
- 6x5 grid (standard Wordle layout)
- Keyboard for input
- Phase indicator (Commit/Reveal/Waiting)
- Timer countdown
- Other players' progress (# of greens, not letters)

### Lobby
- Active rounds by tier
- Next round countdown
- Recent results/leaderboard

## Gas Optimization

### Batch Operations
- Reveal can trigger evaluation if last player
- Evaluation processes all players in one tx (gas limit ~100 players)
- For >100 players: paginated evaluation

### Storage Packing
- Pack PlayerState into fewer slots
- Use uint8 for small values
- Commitments in mapping (not array)

## Deployment Plan

### Testnet (Sepolia)
1. Deploy contracts
2. Test with 3-5 bots
3. Verify timing, commit-reveal, evaluation

### Mainnet (Base)
1. Deploy with conservative limits (max 50 players initially)
2. Start with Standard tier only
3. Add Sprint/High Roller after validation

---

## Open Questions

1. **Reveal window**: What happens if some players don't reveal? Currently: their guess just doesn't count. Alternative: penalize/slash?

2. **Player cap**: Should rounds have max players? Gas limits suggest yes (~100-200 max per round for on-chain evaluation)

3. **Spectators**: Allow watching without playing? Good for engagement but adds complexity.

4. **Streaks/Leaderboard**: Track player stats on-chain or off-chain?

---

## Next Steps

1. [ ] Build core smart contract (WordDuelArena.sol)
2. [ ] Write comprehensive tests
3. [ ] Deploy to Sepolia
4. [ ] Build frontend
5. [ ] Create bot SDK for AI agents
