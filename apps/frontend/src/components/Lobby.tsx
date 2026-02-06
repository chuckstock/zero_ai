import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useRound, usePlayerState, useRegister, TIER_NAMES, TIER_FEES, type Round } from '../hooks/useWordDuel'

interface LobbyProps {
  onJoinRound: (roundId: bigint) => void
}

const ROUND_STATES = ['Waiting', 'Commit', 'Reveal', 'Judging', 'Complete'] as const

export function Lobby({ onJoinRound }: LobbyProps) {
  const { isConnected } = useAccount()
  const [selectedRound, setSelectedRound] = useState<bigint>(1n)
  
  // For demo, show rounds 1-5
  const roundIds = [1n, 2n, 3n, 4n, 5n]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">🎮 Game Lobby</h2>
        <p className="text-gray-400">Join a round and compete to guess the secret word!</p>
      </div>

      {/* Tier Info */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {TIER_NAMES.map((name, tier) => (
          <div
            key={tier}
            className={`p-4 rounded-xl border-2 ${
              tier === 0 ? 'border-blue-500/50 bg-blue-500/10' :
              tier === 1 ? 'border-yellow-500/50 bg-yellow-500/10' :
              'border-purple-500/50 bg-purple-500/10'
            }`}
          >
            <div className="text-sm text-gray-400 mb-1">Tier {tier + 1}</div>
            <div className="text-xl font-bold">{name}</div>
            <div className="text-lg mt-2">
              {TIER_FEES[tier as keyof typeof TIER_FEES]} ETH
            </div>
          </div>
        ))}
      </div>

      {/* Active Rounds */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Active Rounds</h3>
        {roundIds.map((roundId) => (
          <RoundCard
            key={roundId.toString()}
            roundId={roundId}
            onJoin={onJoinRound}
            isConnected={isConnected}
          />
        ))}
      </div>

      {!isConnected && (
        <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
          <p className="text-yellow-400">🔗 Connect your wallet to join a round</p>
        </div>
      )}
    </div>
  )
}

function RoundCard({ roundId, onJoin, isConnected }: { roundId: bigint; onJoin: (id: bigint) => void; isConnected: boolean }) {
  const { data: round, isLoading } = useRound(roundId)
  const { data: playerState } = usePlayerState(roundId)
  const { register, isPending } = useRegister()
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!round) return
    
    const updateTimer = () => {
      const now = BigInt(Math.floor(Date.now() / 1000))
      let deadline: bigint
      let label: string
      
      if (round.state === 1) {
        deadline = round.commitDeadline
        label = 'Commit ends'
      } else if (round.state === 2) {
        deadline = round.revealDeadline
        label = 'Reveal ends'
      } else {
        setTimeLeft('')
        return
      }
      
      const diff = Number(deadline - now)
      if (diff <= 0) {
        setTimeLeft('Phase ended')
      } else {
        const mins = Math.floor(diff / 60)
        const secs = diff % 60
        setTimeLeft(`${label}: ${mins}:${secs.toString().padStart(2, '0')}`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [round])

  if (isLoading) {
    return (
      <div className="p-4 bg-[#1a1a1b] rounded-xl border border-[#3a3a3c] animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="p-4 bg-[#1a1a1b] rounded-xl border border-[#3a3a3c]">
        <div className="text-gray-500">Round #{roundId.toString()} - Not yet created</div>
      </div>
    )
  }

  const tierColors = ['text-blue-400', 'text-yellow-400', 'text-purple-400']
  const stateColors = ['bg-gray-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']

  return (
    <div className={`p-4 bg-[#1a1a1b] rounded-xl border border-[#3a3a3c] hover:border-[#565758] transition ${
      playerState?.registered ? 'ring-2 ring-green-500/50' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-lg font-bold">Round #{roundId.toString()}</div>
            <div className={`text-sm ${tierColors[round.tier]}`}>
              {TIER_NAMES[round.tier]} Tier
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded text-xs ${stateColors[round.state]} bg-opacity-20`}>
            {ROUND_STATES[round.state]}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm text-gray-400">Prize Pool</div>
            <div className="text-lg font-bold text-green-400">
              {formatEther(round.pot)} ETH
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Players</div>
            <div className="text-lg font-bold">{round.playerCount.toString()}</div>
          </div>

          {timeLeft && (
            <div className="text-right">
              <div className="text-sm text-yellow-400 font-mono">{timeLeft}</div>
            </div>
          )}

          {playerState?.registered ? (
            <button
              onClick={() => onJoin(roundId)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Play →
            </button>
          ) : (
            <button
              onClick={() => register(roundId, round.tier)}
              disabled={!isConnected || isPending || round.state !== 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Joining...' : `Join (${TIER_FEES[round.tier as keyof typeof TIER_FEES]} ETH)`}
            </button>
          )}
        </div>
      </div>

      {playerState?.registered && (
        <div className="mt-3 pt-3 border-t border-[#3a3a3c] flex items-center gap-4 text-sm">
          <span className="text-green-400">✓ Registered</span>
          {playerState.committed && <span className="text-yellow-400">✓ Guess Committed</span>}
          {playerState.revealed && <span className="text-blue-400">✓ Guess Revealed</span>}
          {playerState.solved && <span className="text-green-400 font-bold">🎉 Solved!</span>}
        </div>
      )}
    </div>
  )
}
