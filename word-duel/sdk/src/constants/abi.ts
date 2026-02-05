export const WORD_DUEL_ABI = [
  // View Functions
  {
    name: 'getGame',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'player1', type: 'address' },
      { name: 'player2', type: 'address' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'currentRound', type: 'uint8' },
      { name: 'maxRounds', type: 'uint8' },
      { name: 'turnDeadline', type: 'uint256' },
      { name: 'player1Score', type: 'uint8' },
      { name: 'player2Score', type: 'uint8' },
      { name: 'winner', type: 'address' },
      { name: 'targetWordHash', type: 'bytes32' }
    ]
  },
  {
    name: 'getPlayerGuesses',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' }
    ],
    outputs: [
      { name: 'guesses', type: 'bytes32[]' },
      { name: 'feedback', type: 'uint8[][]' }
    ]
  },
  {
    name: 'getOpenGames',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    outputs: [{ name: 'gameIds', type: 'uint256[]' }]
  },
  {
    name: 'getCommitment',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' },
      { name: 'round', type: 'uint8' }
    ],
    outputs: [{ name: 'commitment', type: 'bytes32' }]
  },
  {
    name: 'gameCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  
  // State-Changing Functions
  {
    name: 'createGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'targetWordHash', type: 'bytes32' },
      { name: 'maxRounds', type: 'uint8' }
    ],
    outputs: [{ name: 'gameId', type: 'uint256' }]
  },
  {
    name: 'joinGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'commitGuess',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'commitment', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'revealGuess',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'guess', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'claimWinnings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'claimTimeout',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'cancelGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: []
  },

  // Events
  {
    name: 'GameCreated',
    type: 'event',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player1', type: 'address', indexed: true },
      { name: 'entryFee', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'GameJoined',
    type: 'event',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player2', type: 'address', indexed: true }
    ]
  },
  {
    name: 'GuessCommitted',
    type: 'event',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'round', type: 'uint8', indexed: false }
    ]
  },
  {
    name: 'GuessRevealed',
    type: 'event',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'guess', type: 'bytes32', indexed: false },
      { name: 'feedback', type: 'uint8[]', indexed: false }
    ]
  },
  {
    name: 'GameEnded',
    type: 'event',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'prize', type: 'uint256', indexed: false }
    ]
  }
] as const
