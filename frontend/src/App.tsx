import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { Header } from './components/Header'
import { Lobby } from './components/Lobby'
import { Game } from './components/Game'
import { Results } from './components/Results'

const queryClient = new QueryClient()

type View = 'lobby' | 'game' | 'results'

function AppContent() {
  const [view, setView] = useState<View>('lobby')
  const [activeRoundId, setActiveRoundId] = useState<bigint | null>(null)

  const handleJoinRound = (roundId: bigint) => {
    setActiveRoundId(roundId)
    setView('game')
  }

  const handleBackToLobby = () => {
    setView('lobby')
    setActiveRoundId(null)
  }

  const handleGameComplete = () => {
    setView('results')
  }

  return (
    <div className="min-h-screen bg-[#121213]">
      <Header />
      
      <main className="py-6">
        {view === 'lobby' && (
          <Lobby onJoinRound={handleJoinRound} />
        )}
        
        {view === 'game' && activeRoundId !== null && (
          <Game 
            roundId={activeRoundId} 
            onBack={handleBackToLobby}
            onComplete={handleGameComplete}
          />
        )}
        
        {view === 'results' && activeRoundId !== null && (
          <Results 
            roundId={activeRoundId} 
            onBack={handleBackToLobby}
          />
        )}
      </main>

      <footer className="border-t border-[#3a3a3c] py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Word Duel Arena • Powered by Ethereum</p>
          <p className="mt-1">
            Contract:{' '}
            <a 
              href="https://sepolia.etherscan.io/address/0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline font-mono"
            >
              0xD4Ff...d7443
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
