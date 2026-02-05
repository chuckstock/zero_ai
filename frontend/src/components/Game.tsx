import { useState, useEffect, useCallback } from 'react'
import { formatEther } from 'viem'
import { 
  useRound, 
  usePlayerState, 
  useCommitGuess, 
  useRevealGuess, 
  generateSalt, 
  parseGuessResult,
  TIER_NAMES,
  type Round,
  type PlayerState
} from '../hooks/useWordDuel'

interface GameProps {
  roundId: bigint
  onBack: () => void
  onComplete: () => void
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty'

export function Game({ roundId, onBack, onComplete }: GameProps) {
  const { data: round, refetch: refetchRound } = useRound(roundId)
  const { data: playerState, refetch: refetchPlayer } = usePlayerState(roundId)
  const { commit, isPending: isCommitting } = useCommitGuess()
  const { reveal, isPending: isRevealing } = useRevealGuess()

  const [currentGuess, setCurrentGuess] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [results, setResults] = useState<LetterStatus[][]>([])
  const [pendingCommit, setPendingCommit] = useState<{ guess: string; salt: `0x${string}` } | null>(null)
  const [keyStatuses, setKeyStatuses] = useState<Record<string, LetterStatus>>({})
  const [message, setMessage] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const [phase, setPhase] = useState<'waiting' | 'commit' | 'reveal' | 'complete'>('waiting')

  // Parse existing guess results from player state
  useEffect(() => {
    if (playerState && playerState.guessResults) {
      const newResults: LetterStatus[][] = []
      for (let i = 0; i < playerState.guessCount; i++) {
        const result = playerState.guessResults[i]
        if (result && result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          newResults.push(parseGuessResult(result))
        }
      }
      setResults(newResults)
    }
  }, [playerState])

  // Update timer and phase
  useEffect(() => {
    if (!round) return

    const updatePhase = () => {
      const now = BigInt(Math.floor(Date.now() / 1000))
      
      if (round.state === 0) {
        setPhase('waiting')
        setTimeLeft('Waiting for round to start...')
      } else if (round.state === 1) {
        setPhase('commit')
        const diff = Number(round.commitDeadline - now)
        if (diff > 0) {
          const mins = Math.floor(diff / 60)
          const secs = diff % 60
          setTimeLeft(`Commit Phase: ${mins}:${secs.toString().padStart(2, '0')}`)
        } else {
          setTimeLeft('Commit phase ended')
        }
      } else if (round.state === 2) {
        setPhase('reveal')
        const diff = Number(round.revealDeadline - now)
        if (diff > 0) {
          const mins = Math.floor(diff / 60)
          const secs = diff % 60
          setTimeLeft(`Reveal Phase: ${mins}:${secs.toString().padStart(2, '0')}`)
        } else {
          setTimeLeft('Reveal phase ended')
        }
      } else if (round.state >= 3) {
        setPhase('complete')
        setTimeLeft(round.state === 4 ? 'Round Complete!' : 'Waiting for oracle...')
      }
    }

    updatePhase()
    const interval = setInterval(() => {
      updatePhase()
      refetchRound()
      refetchPlayer()
    }, 1000)

    return () => clearInterval(interval)
  }, [round, refetchRound, refetchPlayer])

  // Update keyboard statuses based on results
  useEffect(() => {
    const newStatuses: Record<string, LetterStatus> = {}
    guesses.forEach((guess, guessIdx) => {
      if (results[guessIdx]) {
        guess.split('').forEach((letter, letterIdx) => {
          const status = results[guessIdx][letterIdx]
          const current = newStatuses[letter.toUpperCase()]
          // Priority: correct > present > absent
          if (status === 'correct' || (!current)) {
            newStatuses[letter.toUpperCase()] = status
          } else if (status === 'present' && current !== 'correct') {
            newStatuses[letter.toUpperCase()] = status
          }
        })
      }
    })
    setKeyStatuses(newStatuses)
  }, [guesses, results])

  const handleKeyPress = useCallback((key: string) => {
    if (phase !== 'commit' || playerState?.committed) return

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setMessage('Word must be 5 letters')
        setTimeout(() => setMessage(''), 2000)
        return
      }
      // Submit commit
      const salt = generateSalt()
      setPendingCommit({ guess: currentGuess, salt })
      commit(roundId, currentGuess, salt)
      setGuesses([...guesses, currentGuess])
      setCurrentGuess('')
    } else if (key === '⌫') {
      setCurrentGuess(currentGuess.slice(0, -1))
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(currentGuess + key)
    }
  }, [currentGuess, phase, playerState, commit, roundId, guesses])

  // Handle physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleKeyPress('ENTER')
      else if (e.key === 'Backspace') handleKeyPress('⌫')
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase())
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKeyPress])

  const handleReveal = () => {
    if (pendingCommit) {
      reveal(roundId, pendingCommit.guess, pendingCommit.salt, [])
    }
  }

  // Save pending commit to localStorage
  useEffect(() => {
    if (pendingCommit) {
      localStorage.setItem(`commit_${roundId}`, JSON.stringify(pendingCommit))
    }
  }, [pendingCommit, roundId])

  // Load pending commit from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`commit_${roundId}`)
    if (saved && !pendingCommit) {
      setPendingCommit(JSON.parse(saved))
    }
  }, [roundId])

  const allGuesses = [...guesses]
  // Fill with empty rows
  while (allGuesses.length < 6) {
    allGuesses.push('')
  }

  // Add current guess to the first empty row
  const displayGuesses = allGuesses.map((g, i) => {
    if (i === guesses.length && currentGuess) {
      return currentGuess.padEnd(5, ' ')
    }
    return g.padEnd(5, ' ')
  })

  if (!round) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">Loading round...</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Lobby
        </button>
        <div className="text-center">
          <div className="text-sm text-gray-400">Round #{roundId.toString()}</div>
          <div className="text-lg font-bold">{TIER_NAMES[round.tier]}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Prize Pool</div>
          <div className="text-green-400 font-bold">{formatEther(round.pot)} ETH</div>
        </div>
      </div>

      {/* Timer */}
      <div className={`text-center py-3 px-6 rounded-lg mb-6 ${
        phase === 'commit' ? 'bg-green-500/20 text-green-400' :
        phase === 'reveal' ? 'bg-yellow-500/20 text-yellow-400' :
        phase === 'complete' ? 'bg-blue-500/20 text-blue-400' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        <div className="text-xl font-mono">{timeLeft}</div>
        <div className="text-sm mt-1">
          Guess {Math.min((playerState?.guessCount || 0) + 1, 6)} of 6
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex justify-center mb-6">
        <div className="grid gap-1">
          {displayGuesses.map((guess, rowIdx) => (
            <div key={rowIdx} className="flex gap-1">
              {guess.split('').map((letter, colIdx) => {
                let status: LetterStatus = 'empty'
                if (results[rowIdx]?.[colIdx]) {
                  status = results[rowIdx][colIdx]
                } else if (letter !== ' ' && rowIdx < guesses.length) {
                  status = 'absent' // Placeholder for uncommitted
                }

                return (
                  <div
                    key={colIdx}
                    className={`tile ${letter !== ' ' ? 'filled' : ''} ${status !== 'empty' ? status : ''}`}
                    style={{ animationDelay: `${colIdx * 0.1}s` }}
                  >
                    {letter !== ' ' ? letter : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center text-red-400 mb-4">{message}</div>
      )}

      {/* Status Messages */}
      {playerState?.solved && (
        <div className="text-center p-4 bg-green-500/20 rounded-lg mb-4 glow-green">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-xl font-bold text-green-400">You solved it!</div>
          <button
            onClick={onComplete}
            className="mt-3 px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
          >
            Claim Prize →
          </button>
        </div>
      )}

      {phase === 'reveal' && playerState?.committed && !playerState?.revealed && (
        <div className="text-center mb-4">
          <button
            onClick={handleReveal}
            disabled={isRevealing}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold disabled:opacity-50"
          >
            {isRevealing ? 'Revealing...' : 'Reveal Your Guess'}
          </button>
        </div>
      )}

      {isCommitting && (
        <div className="text-center text-yellow-400 mb-4">
          Committing guess to blockchain...
        </div>
      )}

      {/* Keyboard */}
      <div className="flex flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={phase !== 'commit' || playerState?.committed}
                className={`key ${key.length > 1 ? 'large' : ''} ${keyStatuses[key] || ''}`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-[#1a1a1b] rounded-lg text-sm text-gray-400">
        <h4 className="font-semibold text-white mb-2">How to Play:</h4>
        <ul className="space-y-1">
          <li>🟩 <span className="text-green-400">Green</span> = Letter is correct</li>
          <li>🟨 <span className="text-yellow-400">Yellow</span> = Letter is in wrong position</li>
          <li>⬛ <span className="text-gray-400">Gray</span> = Letter is not in the word</li>
        </ul>
        <p className="mt-3 text-xs">
          {phase === 'commit' 
            ? 'Type your guess and press ENTER to commit. Your guess is hashed and hidden until reveal phase.'
            : phase === 'reveal'
            ? 'Click "Reveal" to submit your guess for validation by the oracle.'
            : 'Waiting for the next phase...'}
        </p>
      </div>
    </div>
  )
}
