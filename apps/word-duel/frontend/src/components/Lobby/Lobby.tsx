import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Swords, Users, Clock, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import Button from '../shared/Button'
import WagerSelector from './WagerSelector'
import GameList from './GameList'
import MatchmakingQueue from './MatchmakingQueue'
import { useLobbyStore } from '../../stores/lobbyStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useToastStore } from '../../stores/toastStore'
import { parseEthToWei } from '../../utils/helpers'

export default function Lobby() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { addToast } = useToastStore()
  const { isConnected: wsConnected, send } = useWebSocket()
  
  const {
    games,
    inQueue,
    queueWager,
    selectedWager,
    isCreating,
    setSelectedWager,
    setInQueue,
    setIsCreating,
    setQueueWager,
  } = useLobbyStore()

  const [activeTab, setActiveTab] = useState<'quick' | 'create' | 'join'>('quick')

  // Redirect to game when matched
  useEffect(() => {
    // In production, this would come from WebSocket
    // For now, simulate with a timeout when joining queue
  }, [inQueue])

  const handleQuickPlay = () => {
    if (!isConnected) {
      addToast('Please connect your wallet first', 'warning')
      return
    }

    setQueueWager(selectedWager)
    setInQueue(true)
    send('join_queue', {
      address,
      wager: parseEthToWei(selectedWager).toString(),
    })
    addToast('Searching for opponent...', 'info')
  }

  const handleCreateGame = async () => {
    if (!isConnected) {
      addToast('Please connect your wallet first', 'warning')
      return
    }

    setIsCreating(true)
    
    // Simulate game creation - in production, this would be a transaction
    send('create_game', {
      address,
      wager: parseEthToWei(selectedWager).toString(),
    })
    
    addToast('Creating game...', 'info')
    
    // Simulate response
    setTimeout(() => {
      setIsCreating(false)
      addToast('Game created! Waiting for opponent...', 'success')
    }, 1500)
  }

  const handleJoinGame = (gameId: string) => {
    if (!isConnected) {
      addToast('Please connect your wallet first', 'warning')
      return
    }

    send('join_game', { gameId, address })
    navigate(`/game/${gameId}`)
  }

  const handleLeaveQueue = () => {
    send('leave_queue', { address })
    setInQueue(false)
    addToast('Left matchmaking queue', 'info')
  }

  if (inQueue) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <MatchmakingQueue
          wager={queueWager}
          onCancel={handleLeaveQueue}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-tile-correct' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {wsConnected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-800/50 p-1 rounded-xl">
          <TabButton
            active={activeTab === 'quick'}
            onClick={() => setActiveTab('quick')}
            icon={<Sparkles size={18} />}
          >
            Quick Play
          </TabButton>
          <TabButton
            active={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            icon={<Swords size={18} />}
          >
            Create Game
          </TabButton>
          <TabButton
            active={activeTab === 'join'}
            onClick={() => setActiveTab('join')}
            icon={<Users size={18} />}
          >
            Join Game
          </TabButton>
        </div>

        {/* Quick Play */}
        {activeTab === 'quick' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Quick Match</h2>
              <p className="text-gray-400">
                Get matched instantly with a player at the same stake
              </p>
            </div>

            <WagerSelector
              selected={selectedWager}
              onSelect={setSelectedWager}
            />

            <Button
              onClick={handleQuickPlay}
              size="lg"
              fullWidth
              icon={<ArrowRight size={20} />}
              disabled={!isConnected}
            >
              Find Opponent
            </Button>

            {!isConnected && (
              <p className="text-center text-sm text-gray-500">
                Connect your wallet to play
              </p>
            )}
          </div>
        )}

        {/* Create Game */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Create a Game</h2>
              <p className="text-gray-400">
                Set your wager and wait for someone to challenge you
              </p>
            </div>

            <WagerSelector
              selected={selectedWager}
              onSelect={setSelectedWager}
            />

            <Button
              onClick={handleCreateGame}
              size="lg"
              fullWidth
              loading={isCreating}
              icon={<Swords size={20} />}
              disabled={!isConnected}
            >
              Create Game
            </Button>
          </div>
        )}

        {/* Join Game */}
        {activeTab === 'join' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Open Games</h2>
              <p className="text-gray-400">
                Join an existing game at your preferred stake
              </p>
            </div>

            <GameList
              games={games}
              onJoin={handleJoinGame}
              currentAddress={address}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-tile-correct text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  )
}
