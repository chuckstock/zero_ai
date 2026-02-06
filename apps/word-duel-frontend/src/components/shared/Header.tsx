import { Link, useLocation } from 'react-router-dom'
import { Settings, Trophy, Home, Menu, X } from 'lucide-react'
import { useState } from 'react'
import WalletButton from './WalletButton'
import SettingsModal from './SettingsModal'

export default function Header() {
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <header className="bg-game-bg border-b border-tile-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              Word<span className="text-tile-correct">Duel</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-tile-correct text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            
            <Link
              to="/leaderboard"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                isActive('/leaderboard')
                  ? 'bg-tile-correct text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy size={18} />
              <span>Leaderboard</span>
            </Link>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>

            <WalletButton />
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <WalletButton compact />
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <nav className="md:hidden border-t border-tile-border px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isActive('/') ? 'bg-tile-correct text-white' : 'text-gray-400'
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            
            <Link
              to="/leaderboard"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isActive('/leaderboard') ? 'bg-tile-correct text-white' : 'text-gray-400'
              }`}
            >
              <Trophy size={18} />
              <span>Leaderboard</span>
            </Link>

            <button
              onClick={() => {
                setShowMobileMenu(false)
                setShowSettings(true)
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 w-full"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        )}
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
