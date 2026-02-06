import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, keccak256, encodePacked, toHex } from 'viem'
import { WORD_DUEL_CONTRACT } from '../config/wagmi'
import { wordDuelABI } from '../config/abi'

export const TIER_FEES = {
  0: '0.001', // Sprint
  1: '0.01',  // Standard
  2: '0.1',   // HighRoller
} as const

export const TIER_NAMES = ['Sprint', 'Standard', 'HighRoller'] as const

export interface Round {
  tier: number
  startTime: bigint
  commitDeadline: bigint
  revealDeadline: bigint
  currentGuess: number
  playerCount: bigint
  pot: bigint
  state: number
  winnersCount: bigint
  merkleRoot: `0x${string}`
}

export interface PlayerState {
  registered: boolean
  committed: boolean
  revealed: boolean
  solved: boolean
  claimed: boolean
  currentCommitment: `0x${string}`
  guessResults: readonly `0x${string}`[]
  guessCount: number
}

export function useCurrentRoundId() {
  return useReadContract({
    address: WORD_DUEL_CONTRACT,
    abi: wordDuelABI,
    functionName: 'currentRoundId',
  })
}

export function useRound(roundId: bigint | undefined) {
  return useReadContract({
    address: WORD_DUEL_CONTRACT,
    abi: wordDuelABI,
    functionName: 'getRound',
    args: roundId !== undefined ? [roundId] : undefined,
    query: { enabled: roundId !== undefined },
  })
}

export function usePlayerState(roundId: bigint | undefined) {
  const { address } = useAccount()
  return useReadContract({
    address: WORD_DUEL_CONTRACT,
    abi: wordDuelABI,
    functionName: 'getPlayerState',
    args: roundId !== undefined && address ? [roundId, address] : undefined,
    query: { enabled: roundId !== undefined && !!address },
  })
}

export function useRegister() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const register = (roundId: bigint, tier: number) => {
    const fee = TIER_FEES[tier as keyof typeof TIER_FEES]
    writeContract({
      address: WORD_DUEL_CONTRACT,
      abi: wordDuelABI,
      functionName: 'register',
      args: [roundId],
      value: parseEther(fee),
    })
  }

  return { register, isPending: isPending || isConfirming, isSuccess, error }
}

export function useCommitGuess() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const commit = (roundId: bigint, guess: string, salt: `0x${string}`) => {
    const commitment = keccak256(encodePacked(['string', 'bytes32'], [guess.toLowerCase(), salt]))
    writeContract({
      address: WORD_DUEL_CONTRACT,
      abi: wordDuelABI,
      functionName: 'commitGuess',
      args: [roundId, commitment],
    })
    return { commitment, salt }
  }

  return { commit, isPending: isPending || isConfirming, isSuccess, error }
}

export function useRevealGuess() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const reveal = (roundId: bigint, guess: string, salt: `0x${string}`, merkleProof: `0x${string}`[] = []) => {
    writeContract({
      address: WORD_DUEL_CONTRACT,
      abi: wordDuelABI,
      functionName: 'revealGuess',
      args: [roundId, guess.toLowerCase(), salt, merkleProof],
    })
  }

  return { reveal, isPending: isPending || isConfirming, isSuccess, error }
}

export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = (roundId: bigint) => {
    writeContract({
      address: WORD_DUEL_CONTRACT,
      abi: wordDuelABI,
      functionName: 'claimPrize',
      args: [roundId],
    })
  }

  return { claim, isPending: isPending || isConfirming, isSuccess, error }
}

export function generateSalt(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return toHex(randomBytes) as `0x${string}`
}

export function parseGuessResult(result: `0x${string}`): ('correct' | 'present' | 'absent')[] {
  // Result is encoded as 5 bytes, each representing a letter status
  // 2 = correct, 1 = present, 0 = absent
  const hex = result.slice(2, 12) // Take first 10 hex chars (5 bytes)
  const results: ('correct' | 'present' | 'absent')[] = []
  
  for (let i = 0; i < 5; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (byte === 2) results.push('correct')
    else if (byte === 1) results.push('present')
    else results.push('absent')
  }
  
  return results
}
