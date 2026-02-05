# Word Duel Arena - Deployment

## Sepolia Testnet

### V2 (Current - Secure)
**Contract:** WordDuelArenaV2  
**Address:** `0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443`
**Fee Vault:** `0x9379e3b2b61720F6e0fe5AAbbd5e1A9EAC506cb5`
**Oracle:** `0x9379e3b2b61720F6e0fe5AAbbd5e1A9EAC506cb5`
**Explorer:** https://sepolia.etherscan.io/address/0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443

### V1 (Deprecated - Security Issues)
**Contract:** WordDuelArena
**Address:** `0xa9CC7ACe55489CBa5C788257679BcdA10a9c319b`
**Fee Vault:** `0x9379e3b2b61720F6e0fe5AAbbd5e1A9EAC506cb5`
**Merkle Root:** `0x0...0` (disabled for testing - accepts any word)

**Deployed:** 2026-02-05
**Chain ID:** 11155111
**Explorer:** https://sepolia.etherscan.io/address/0xa9CC7ACe55489CBa5C788257679BcdA10a9c319b

## Tier Configuration

| Tier | Entry Fee | Commit Window | Reveal Window | Active |
|------|-----------|---------------|---------------|--------|
| Sprint | 0.001 ETH | 30 sec | 30 sec | ✅ |
| Standard | 0.01 ETH | 45 sec | 45 sec | ✅ |
| High Roller | 0.1 ETH | 60 sec | 60 sec | ❌ |

## How to Play

### 1. Create a Round (Owner only)
```bash
# Generate word hash
WORD="CRANE"
SALT=$(cast keccak 'some_random_salt')
WORD_HASH=$(cast keccak $(cast abi-encode "f(bytes5,bytes32)" "0x$(echo -n $WORD | xxd -p)" $SALT))

# Create round
cast send $ARENA "createRound(uint8,bytes32)" 1 $WORD_HASH --rpc-url $RPC
```

### 2. Register (Players)
```solidity
// Pay entry fee to join
arena.register{value: 0.01 ether}(roundId);
```

### 3. Start Round (Anyone after registration)
```solidity
arena.startRound(roundId);
```

### 4. Commit Guess
```solidity
bytes32 commitment = keccak256(abi.encodePacked(guess, playerSalt));
arena.commitGuess(roundId, commitment);
```

### 5. Reveal Guess
```solidity
arena.revealGuess(roundId, guess, playerSalt, merkleProof);
```

### 6. Advance Phases
```solidity
// Anyone can call after deadline
arena.advancePhase(roundId);
```

### 7. Evaluate & Finalize
```solidity
// Owner reveals word and evaluates
arena.evaluateRound(roundId, word, wordSalt);
arena.advancePhase(roundId); // Move to Complete
arena.finalizeRound(roundId); // Distribute prizes
```

## Key Events

- `RoundCreated(roundId, tier, wordHash, startTime)`
- `PlayerRegistered(roundId, player, pot)`
- `PhaseAdvanced(roundId, phase, guessNum, deadline)`
- `GuessCommitted(roundId, player, guessNum)`
- `GuessRevealed(roundId, player, guessNum, guess, correctCount)`
- `PlayerSolved(roundId, player, guessNum)`
- `RoundComplete(roundId, word, winnerCount, prizePerWinner)`

## Bot Integration

Bots should:
1. Listen for `RoundCreated` events
2. Call `register()` during Registration phase
3. Listen for `PhaseAdvanced` to Commit
4. Submit `commitGuess()` within commit window
5. Listen for `PhaseAdvanced` to Reveal
6. Submit `revealGuess()` within reveal window
7. Repeat for up to 6 guesses
8. Collect winnings when round ends
