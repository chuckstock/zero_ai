import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
})

export const ARENA_ADDRESS = '0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443' as const

export const ARENA_ABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'commitGuess',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'commitment', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revealGuess',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'guess', type: 'bytes5' },
      { name: 'salt', type: 'bytes32' },
      { name: 'wordProof', type: 'bytes32[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimPrize',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getRound',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'tier', type: 'uint8' },
          { name: 'wordHash', type: 'bytes32' },
          { name: 'wordMerkleProof', type: 'bytes32' },
          { name: 'pot', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'phaseDeadline', type: 'uint256' },
          { name: 'playerCount', type: 'uint256' },
          { name: 'phase', type: 'uint8' },
          { name: 'currentGuess', type: 'uint8' },
          { name: 'winningGuessNum', type: 'uint8' },
          { name: 'winnerCount', type: 'uint256' },
          { name: 'rolloverPot', type: 'uint256' },
          { name: 'evaluated', type: 'bool' },
          { name: 'finalized', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayerState',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'registered', type: 'bool' },
          { name: 'solved', type: 'bool' },
          { name: 'solvedAtGuess', type: 'uint8' },
          { name: 'guessCount', type: 'uint8' },
          { name: 'claimablePrize', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCommitment',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player', type: 'address' },
      { name: 'guessNum', type: 'uint8' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'hash', type: 'bytes32' },
          { name: 'revealed', type: 'bool' },
          { name: 'guess', type: 'bytes5' },
          { name: 'feedback', type: 'uint40' },
          { name: 'feedbackReceived', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'roundCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const PHASES = ['Registration', 'Commit', 'Reveal', 'AwaitingFeedback', 'Complete'] as const
export const TIERS = ['Sprint', 'Standard', 'HighRoller'] as const
export const TIER_FEES = [0.001, 0.01, 0.1] as const
