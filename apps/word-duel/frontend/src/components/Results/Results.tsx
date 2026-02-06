import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Trophy, XCircle, Share2, RotateCw, Home, Copy, Check } from 'lucide-react'
import Button from '../shared/Button'
import { useGameStore } from '../../stores/gameStore'
import { useConfetti } from '../../hooks/useConfetti'
import { useSound } from '../../hooks/useSound'
import { formatEth, generateShareText, copyToClipboard } from '../../utils/helpers'
import { clsx } from 'clsx'

export default function Results() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const won = searchParams.get('won') === 'true'
  
  const { board, currentRow, resetGame } = useGameStore()
  const { fireWinConfetti } = useConfetti()
  const { playWin, playLose } = useSound()
  
  const [copied, setCopied] = useState(false)

  // Mock data - in production, fetch from server
  const mockResult = {
    word: 'APPLE',
    potAmount: BigInt(20_000_000_000_000_000),
    earnings: BigInt(19_000_000_000_000_000), // 95% after fee
    guesses: currentRow,
    opponentGuesses: won ? currentRow + 2 : currentRow - 1,
  }

  useEffect(() => {
    if (won) {
      fireWinConfetti()
      playWin()
    } else {
      playLose()
    }
  }, [won])

  const handleShare = async () => {
    const text = generateShareText(gameId || '', won, mockResult.guesses, 6)
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePlayAgain = () => {
    resetGame()
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Result Card */}
        <div
          className={clsx(
            'rounded-2xl p-8 text-center mb-6',
            won ? 'bg-gradient-to-b from-tile-correct/20 to-transparent' : 'bg-gray-800/50'
          )}
        >
          {/* Icon */}
          <div
            className={clsx(
              'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6',
              won ? 'bg-tile-correct' : 'bg-red-600'
            )}
          >
            {won ? (
              <Trophy size={48} className="text-white" />
            ) : (
              <XCircle size={48} className="text-white" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-2">
            {won ? 'Victory!' : 'Defeat'}
          </h1>
          <p className="text-gray-400 mb-6">
            {won
              ? `You solved it in ${mockResult.guesses} ${mockResult.guesses === 1 ? 'guess' : 'guesses'}!`
              : 'Better luck next time!'}
          </p>

          {/* Word Reveal */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">The word was</p>
            <p className="text-3xl font-bold text-tile-correct tracking-widest">
              {mockResult.word}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Your Guesses</p>
              <p className="text-2xl font-bold text-white">{mockResult.guesses}/6</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Opponent</p>
              <p className="text-2xl font-bold text-white">
                {mockResult.opponentGuesses > 6 ? 'X' : mockResult.opponentGuesses}/6
              </p>
            </div>
          </div>

          {/* Earnings */}
          {won && (
            <div className="bg-tile-correct/20 border border-tile-correct rounded-xl p-4 mb-6">
              <p className="text-sm text-tile-correct mb-1">You Won</p>
              <p className="text-3xl font-bold text-tile-correct">
                +{formatEth(mockResult.earnings, 4)} ETH
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Pot: {formatEth(mockResult.potAmount, 4)} ETH (5% fee)
              </p>
            </div>
          )}

          {/* Board Preview */}
          <div className="flex justify-center mb-6">
            <div className="grid gap-0.5">
              {board.slice(0, currentRow).map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-0.5">
                  {row.map((tile, tileIndex) => (
                    <div
                      key={tileIndex}
                      className={clsx(
                        'w-6 h-6 rounded-sm',
                        tile.state === 'correct' && 'bg-tile-correct',
                        tile.state === 'present' && 'bg-tile-present',
                        tile.state === 'absent' && 'bg-tile-absent'
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleShare}
            variant="secondary"
            fullWidth
            icon={copied ? <Check size={20} /> : <Share2 size={20} />}
          >
            {copied ? 'Copied!' : 'Share Result'}
          </Button>

          <Link to="/lobby" onClick={handlePlayAgain} className="block">
            <Button fullWidth icon={<RotateCw size={20} />}>
              Play Again
            </Button>
          </Link>

          <Link to="/" onClick={handlePlayAgain} className="block">
            <Button variant="ghost" fullWidth icon={<Home size={20} />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
