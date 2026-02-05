import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import GameBoard from './GameBoard'
import Keyboard from './Keyboard'
import Timer from './Timer'
import OpponentProgress from './OpponentProgress'
import CountdownOverlay from './CountdownOverlay'
import { useGameStore } from '../../stores/gameStore'
import { useToastStore } from '../../stores/toastStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useGameTimer } from '../../hooks/useGameTimer'
import { useSound } from '../../hooks/useSound'
import { useConfetti } from '../../hooks/useConfetti'
import { VALID_WORDS, WORD_LENGTH, TURN_DURATION } from '../../lib/constants'
import { formatAddress } from '../../utils/helpers'

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { addToast } = useToastStore()
  const { send } = useWebSocket()
  const { playSubmit, playInvalid, playWin, playLose } = useSound()
  const { fireWinConfetti, fireLoseConfetti } = useConfetti()
  
  const {
    game,
    board,
    currentRow,
    currentGuess,
    keyboardState,
    opponentBoard,
    isShaking,
    timeRemaining,
    isSubmitting,
    setGame,
    setShaking,
    setSubmitting,
    submitGuess,
    resetGame,
  } = useGameStore()

  const [showCountdown, setShowCountdown] = useState(true)
  const [countdownValue, setCountdownValue] = useState(3)

  // Mock game state for development
  useEffect(() => {
    if (!game && gameId) {
      // In production, fetch game state from server
      setGame({
        id: gameId,
        status: 'countdown',
        players: [
          {
            address: address || '0x0',
            currentRow: 0,
            board: board,
            hasWon: false,
            hasLost: false,
          },
        ],
        currentTurn: address || '0x0',
        turnStartTime: Date.now(),
        turnDuration: TURN_DURATION,
        wager: BigInt(10_000_000_000_000_000),
        totalPot: BigInt(20_000_000_000_000_000),
        createdAt: Date.now(),
      })
    }
  }, [gameId, address])

  // Countdown before game starts
  useEffect(() => {
    if (showCountdown && countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue((v) => v - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdownValue === 0) {
      setTimeout(() => {
        setShowCountdown(false)
        if (game) {
          setGame({ ...game, status: 'active' })
        }
      }, 500)
    }
  }, [showCountdown, countdownValue, game])

  // Timer management
  const { isUrgent, resetTimer } = useGameTimer({
    onTimeout: () => {
      addToast('Time\'s up! Turn passed.', 'warning')
      // In production, server handles turn timeout
    },
  })

  // Handle guess submission
  const handleSubmit = useCallback(() => {
    if (isSubmitting) return
    
    if (currentGuess.length !== WORD_LENGTH) {
      setShaking(true)
      playInvalid()
      addToast('Not enough letters', 'warning')
      return
    }

    if (!VALID_WORDS.has(currentGuess)) {
      setShaking(true)
      playInvalid()
      addToast('Not in word list', 'warning')
      return
    }

    setSubmitting(true)
    playSubmit()

    // Send guess to server
    send('submit_guess', {
      gameId,
      address,
      guess: currentGuess,
    })

    // For development, simulate local evaluation
    // In production, server validates and returns results
    const mockTargetWord = 'APPLE' // Would come from server
    const results = submitGuess(mockTargetWord)

    if (results) {
      // Check for win
      const won = results.every((r) => r === 'correct')
      if (won) {
        setTimeout(() => {
          playWin()
          fireWinConfetti()
          addToast('You won! 🎉', 'success')
          setTimeout(() => navigate(`/results/${gameId}?won=true`), 2000)
        }, 500)
      } else if (currentRow >= 5) {
        // Out of guesses
        setTimeout(() => {
          playLose()
          fireLoseConfetti()
          addToast('Out of guesses!', 'error')
          setTimeout(() => navigate(`/results/${gameId}?won=false`), 2000)
        }, 500)
      } else {
        // Reset timer for next turn
        resetTimer(TURN_DURATION)
      }
    }

    setSubmitting(false)
  }, [currentGuess, isSubmitting, gameId, address, currentRow])

  // Keyboard hook
  useKeyboard({
    disabled: game?.status !== 'active' || isSubmitting,
    onEnter: handleSubmit,
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => resetGame()
  }, [])

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Loading game...</p>
      </div>
    )
  }

  const isMyTurn = game.currentTurn === address
  const opponent = game.players.find((p) => p.address !== address)

  return (
    <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-4 no-select">
      {/* Countdown Overlay */}
      {showCountdown && <CountdownOverlay value={countdownValue} />}

      {/* Game Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">
            {opponent ? `vs ${formatAddress(opponent.address)}` : 'Waiting for opponent...'}
          </p>
          <p className="text-xs text-gray-500">
            Pot: {(Number(game.totalPot) / 1e18).toFixed(3)} ETH
          </p>
        </div>
        <Timer
          seconds={timeRemaining}
          isUrgent={isUrgent}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* My Board */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2">Your Board</p>
          <GameBoard
            board={board}
            currentRow={currentRow}
            isShaking={isShaking}
          />
        </div>

        {/* Opponent Board */}
        {opponentBoard && (
          <div className="flex-1 flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2">Opponent</p>
            <OpponentProgress board={opponentBoard} />
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div className="mt-4">
        <Keyboard
          keyboardState={keyboardState}
          onKeyPress={(key) => {
            if (game.status !== 'active' || isSubmitting) return
            if (key === 'ENTER') {
              handleSubmit()
            } else {
              useGameStore.getState().addLetter(key)
            }
          }}
          disabled={game.status !== 'active' || isSubmitting}
        />
      </div>
    </div>
  )
}
