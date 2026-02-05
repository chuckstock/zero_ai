export const wordDuelABI = [
  // Read functions
  {
    name: 'getRound',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'tier', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'commitDeadline', type: 'uint256' },
          { name: 'revealDeadline', type: 'uint256' },
          { name: 'currentGuess', type: 'uint8' },
          { name: 'playerCount', type: 'uint256' },
          { name: 'pot', type: 'uint256' },
          { name: 'state', type: 'uint8' },
          { name: 'winnersCount', type: 'uint256' },
          { name: 'merkleRoot', type: 'bytes32' },
        ],
      },
    ],
  },
  {
    name: 'getPlayerState',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'registered', type: 'bool' },
          { name: 'committed', type: 'bool' },
          { name: 'revealed', type: 'bool' },
          { name: 'solved', type: 'bool' },
          { name: 'claimed', type: 'bool' },
          { name: 'currentCommitment', type: 'bytes32' },
          { name: 'guessResults', type: 'bytes32[6]' },
          { name: 'guessCount', type: 'uint8' },
        ],
      },
    ],
  },
  {
    name: 'currentRoundId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getActiveRounds',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'entryFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tier', type: 'uint8' }],
    outputs: [{ type: 'uint256' }],
  },
  // Write functions
  {
    name: 'register',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'commitGuess',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'commitment', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'revealGuess',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'guess', type: 'string' },
      { name: 'salt', type: 'bytes32' },
      { name: 'merkleProof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  {
    name: 'claimPrize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [],
  },
  // Events
  {
    name: 'RoundCreated',
    type: 'event',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'tier', type: 'uint8' },
      { name: 'startTime', type: 'uint256' },
    ],
  },
  {
    name: 'PlayerRegistered',
    type: 'event',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
    ],
  },
  {
    name: 'GuessCommitted',
    type: 'event',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'guessNumber', type: 'uint8' },
    ],
  },
  {
    name: 'GuessRevealed',
    type: 'event',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'guess', type: 'string' },
      { name: 'result', type: 'bytes32' },
    ],
  },
  {
    name: 'PrizeClaimed',
    type: 'event',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
    ],
  },
] as const
