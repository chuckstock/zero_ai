import { formatEther } from 'viem'
import { useRound, usePlayerState, useClaimPrize, TIER_NAMES } from '../hooks/useWordDuel'

interface ResultsProps {
  roundId: bigint
  onBack: () => void
}

export function Results({ roundId, onBack }: ResultsProps) {
  const { data: round } = useRound(roundId)
  const { data: playerState } = usePlayerState(roundId)
  const { claim, isPending, isSuccess } = useClaimPrize()

  if (!round) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Loading results...</div>
      </div>
    )
  }

  const isWinner = playerState?.solved && !playerState?.claimed
  const hasClaimed = playerState?.claimed
  const prizePerWinner = round.winnersCount > 0n 
    ? round.pot / round.winnersCount 
    : 0n

  return (
    <div className="max-w-lg mx-auto p-6">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white transition mb-6"
      >
        ← Back to Lobby
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-4">
          {isWinner ? '🏆' : hasClaimed ? '✅' : '🎮'}
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Round #{roundId.toString()} Complete
        </h2>
        <p className="text-gray-400">{TIER_NAMES[round.tier]} Tier</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1a1b] p-4 rounded-xl text-center">
          <div className="text-sm text-gray-400 mb-1">Total Pot</div>
          <div className="text-xl font-bold text-green-400">
            {formatEther(round.pot)} ETH
          </div>
        </div>
        <div className="bg-[#1a1a1b] p-4 rounded-xl text-center">
          <div className="text-sm text-gray-400 mb-1">Winners</div>
          <div className="text-xl font-bold text-yellow-400">
            {round.winnersCount.toString()}
          </div>
        </div>
        <div className="bg-[#1a1a1b] p-4 rounded-xl text-center">
          <div className="text-sm text-gray-400 mb-1">Prize Each</div>
          <div className="text-xl font-bold text-purple-400">
            {formatEther(prizePerWinner)} ETH
          </div>
        </div>
      </div>

      {/* Your Results */}
      <div className="bg-[#1a1a1b] p-6 rounded-xl mb-6">
        <h3 className="text-xl font-bold mb-4">Your Results</h3>
        
        {playerState?.registered ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className={playerState.solved ? 'text-green-400 font-bold' : 'text-red-400'}>
                {playerState.solved ? '🎉 Winner!' : 'Better luck next time'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Guesses Used</span>
              <span>{playerState.guessCount} / 6</span>
            </div>
            {playerState.solved && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prize</span>
                <span className="text-green-400 font-bold">
                  {formatEther(prizePerWinner)} ETH
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">You did not participate in this round.</p>
        )}
      </div>

      {/* Claim Button */}
      {isWinner && !hasClaimed && (
        <button
          onClick={() => claim(roundId)}
          disabled={isPending}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-bold text-lg disabled:opacity-50 glow-green"
        >
          {isPending ? 'Claiming...' : `🎁 Claim ${formatEther(prizePerWinner)} ETH`}
        </button>
      )}

      {hasClaimed && (
        <div className="w-full py-4 bg-green-600/20 text-green-400 rounded-xl text-center font-bold text-lg">
          ✅ Prize Claimed!
        </div>
      )}

      {isSuccess && !hasClaimed && (
        <div className="mt-4 p-4 bg-green-500/20 rounded-lg text-center text-green-400">
          🎉 Prize claimed successfully! Check your wallet.
        </div>
      )}

      {/* Play Again */}
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
        >
          Play Another Round
        </button>
      </div>
    </div>
  )
}
