import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, keccak256, encodePacked, toHex } from 'viem'
import { ARENA_ADDRESS, ARENA_ABI, PHASES, TIERS, TIER_FEES } from './config'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const [roundId, setRoundId] = useState<bigint>(1n)
  const [currentGuess, setCurrentGuess] = useState('')
  const [guessHistory, setGuessHistory] = useState<Array<{guess: string, feedback: number[]}>>([])
  const [salt, setSalt] = useState<`0x${string}`>('0x0')
  const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>()
  
  // Generate random salt on mount
  useEffect(() => {
    const randomSalt = keccak256(toHex(Date.now().toString() + Math.random().toString()))
    setSalt(randomSalt)
  }, [])
  
  // Read round data
  const { data: round, refetch: refetchRound } = useReadContract({
    address: ARENA_ADDRESS,
    abi: ARENA_ABI,
    functionName: 'getRound',
    args: [roundId],
  })
  
  // Read player state
  const { data: playerState, refetch: refetchPlayer } = useReadContract({
    address: ARENA_ADDRESS,
    abi: ARENA_ABI,
    functionName: 'getPlayerState',
    args: [roundId, address!],
    query: { enabled: !!address },
  })
  
  // Read round counter
  const { data: roundCounter } = useReadContract({
    address: ARENA_ADDRESS,
    abi: ARENA_ABI,
    functionName: 'roundCounter',
  })
  
  // Write functions
  const { writeContract, data: txHash, isPending } = useWriteContract()
  
  // Wait for tx
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: pendingTx,
  })
  
  useEffect(() => {
    if (txHash) {
      setPendingTx(txHash)
    }
  }, [txHash])
  
  useEffect(() => {
    if (isTxSuccess) {
      refetchRound()
      refetchPlayer()
      setPendingTx(undefined)
    }
  }, [isTxSuccess])
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRound()
      refetchPlayer()
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // Register for round
  const handleRegister = () => {
    if (!round) return
    const fee = TIER_FEES[round.tier]
    writeContract({
      address: ARENA_ADDRESS,
      abi: ARENA_ABI,
      functionName: 'register',
      args: [roundId],
      value: parseEther(fee.toString()),
    })
  }
  
  // Commit guess
  const handleCommit = () => {
    if (currentGuess.length !== 5) {
      alert('Guess must be 5 letters!')
      return
    }
    const guessBytes = toHex(currentGuess.toUpperCase(), { size: 5 }) as `0x${string}`
    const commitment = keccak256(encodePacked(['bytes5', 'bytes32'], [guessBytes, salt]))
    
    writeContract({
      address: ARENA_ADDRESS,
      abi: ARENA_ABI,
      functionName: 'commitGuess',
      args: [roundId, commitment],
    })
  }
  
  // Reveal guess
  const handleReveal = () => {
    const guessBytes = toHex(currentGuess.toUpperCase(), { size: 5 }) as `0x${string}`
    writeContract({
      address: ARENA_ADDRESS,
      abi: ARENA_ABI,
      functionName: 'revealGuess',
      args: [roundId, guessBytes, salt, []],
    })
    
    // Add to history (feedback will come from oracle)
    setGuessHistory([...guessHistory, { guess: currentGuess.toUpperCase(), feedback: [] }])
    setCurrentGuess('')
    // Generate new salt for next guess
    setSalt(keccak256(toHex(Date.now().toString() + Math.random().toString())))
  }
  
  // Claim prize
  const handleClaim = () => {
    writeContract({
      address: ARENA_ADDRESS,
      abi: ARENA_ABI,
      functionName: 'claimPrize',
      args: [roundId],
    })
  }
  
  const phase = round ? PHASES[round.phase] : 'Loading...'
  const isRegistered = playerState?.registered ?? false
  const isSolved = playerState?.solved ?? false
  const claimable = playerState?.claimablePrize ?? 0n
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Word<span className="text-green-500">Duel</span> Arena
          </h1>
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Connect Wallet
            </button>
          )}
        </header>
        
        {/* Round Selector */}
        <div className="mb-6 flex items-center gap-4">
          <label>Round:</label>
          <input
            type="number"
            value={roundId.toString()}
            onChange={(e) => setRoundId(BigInt(e.target.value || '1'))}
            className="w-20 px-2 py-1 bg-gray-800 rounded"
          />
          <span className="text-gray-400">
            (Latest: {roundCounter?.toString() || '?'})
          </span>
        </div>
        
        {/* Round Info */}
        {round && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-400">Phase:</span>{' '}
                <span className={`font-bold ${phase === 'Complete' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {phase}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Tier:</span>{' '}
                <span className="font-bold">{TIERS[round.tier]}</span>
              </div>
              <div>
                <span className="text-gray-400">Pot:</span>{' '}
                <span className="font-bold text-green-500">{formatEther(round.pot)} ETH</span>
              </div>
              <div>
                <span className="text-gray-400">Players:</span>{' '}
                <span className="font-bold">{round.playerCount.toString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Current Guess:</span>{' '}
                <span className="font-bold">{round.currentGuess}/6</span>
              </div>
              <div>
                <span className="text-gray-400">Deadline:</span>{' '}
                <span className="font-bold">
                  {new Date(Number(round.phaseDeadline) * 1000).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            {/* Player Status */}
            {isConnected && (
              <div className="border-t border-gray-700 pt-4">
                <p>
                  <span className="text-gray-400">Your Status:</span>{' '}
                  {isRegistered ? (
                    isSolved ? (
                      <span className="text-green-500 font-bold">SOLVED! 🎉</span>
                    ) : (
                      <span className="text-blue-500">Playing</span>
                    )
                  ) : (
                    <span className="text-gray-500">Not Registered</span>
                  )}
                </p>
                {claimable > 0n && (
                  <p className="text-green-500 font-bold mt-2">
                    Prize available: {formatEther(claimable)} ETH
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        {isConnected && round && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            {/* Registration */}
            {phase === 'Registration' && !isRegistered && (
              <button
                onClick={handleRegister}
                disabled={isPending || isTxLoading}
                className="w-full py-3 bg-green-600 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {isPending || isTxLoading ? 'Processing...' : `Register (${TIER_FEES[round.tier]} ETH)`}
              </button>
            )}
            
            {/* Commit Phase */}
            {phase === 'Commit' && isRegistered && !isSolved && (
              <div>
                <input
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value.slice(0, 5))}
                  placeholder="Enter 5-letter word"
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg mb-4 text-center text-2xl uppercase tracking-widest"
                  maxLength={5}
                />
                <button
                  onClick={handleCommit}
                  disabled={currentGuess.length !== 5 || isPending || isTxLoading}
                  className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending || isTxLoading ? 'Processing...' : 'Commit Guess'}
                </button>
              </div>
            )}
            
            {/* Reveal Phase */}
            {phase === 'Reveal' && isRegistered && !isSolved && currentGuess && (
              <button
                onClick={handleReveal}
                disabled={isPending || isTxLoading}
                className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                {isPending || isTxLoading ? 'Processing...' : 'Reveal Guess'}
              </button>
            )}
            
            {/* Claim Prize */}
            {phase === 'Complete' && claimable > 0n && (
              <button
                onClick={handleClaim}
                disabled={isPending || isTxLoading}
                className="w-full py-3 bg-yellow-600 rounded-lg font-bold hover:bg-yellow-700 disabled:opacity-50"
              >
                {isPending || isTxLoading ? 'Processing...' : `Claim ${formatEther(claimable)} ETH`}
              </button>
            )}
            
            {/* Waiting messages */}
            {phase === 'AwaitingFeedback' && (
              <p className="text-center text-gray-400">
                Waiting for oracle feedback...
              </p>
            )}
          </div>
        )}
        
        {/* Guess History */}
        {guessHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Your Guesses</h2>
            <div className="space-y-2">
              {guessHistory.map((g, i) => (
                <div key={i} className="flex justify-center gap-1">
                  {g.guess.split('').map((letter, j) => (
                    <div
                      key={j}
                      className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded ${
                        g.feedback[j] === 2 ? 'bg-green-600' :
                        g.feedback[j] === 1 ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sepolia Notice */}
        <p className="text-center text-gray-500 mt-8 text-sm">
          ⚠️ This is on Sepolia testnet. Get test ETH from a faucet.
        </p>
      </div>
    </div>
  )
}

export default App
