import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { formatAddress, copyToClipboard } from '../../utils/helpers'
import { useToastStore } from '../../stores/toastStore'

interface WalletButtonProps {
  compact?: boolean
}

export default function WalletButton({ compact = false }: WalletButtonProps) {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { addToast } = useToastStore()
  
  const [showDropdown, setShowDropdown] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setShowConnectors(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyAddress = async () => {
    if (address) {
      const success = await copyToClipboard(address)
      addToast(success ? 'Address copied!' : 'Failed to copy', success ? 'success' : 'error')
    }
    setShowDropdown(false)
  }

  const handleViewExplorer = () => {
    if (address) {
      window.open(`https://basescan.org/address/${address}`, '_blank')
    }
    setShowDropdown(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setShowDropdown(false)
  }

  if (!isConnected) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowConnectors(!showConnectors)}
          disabled={isPending}
          className={`flex items-center gap-2 bg-tile-correct hover:bg-tile-correct/80 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 ${
            compact ? 'px-3 py-2 text-sm' : 'px-4 py-2'
          }`}
        >
          <Wallet size={compact ? 16 : 18} />
          {!compact && <span>{isPending ? 'Connecting...' : 'Connect'}</span>}
        </button>

        {showConnectors && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-tile-border rounded-lg shadow-xl overflow-hidden z-50">
            <div className="p-2">
              <p className="text-xs text-gray-400 px-3 py-2">Connect with</p>
              {connectors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    connect({ connector: c })
                    setShowConnectors(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors ${
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-2'
        }`}
      >
        <div className="w-2 h-2 bg-tile-correct rounded-full" />
        <span className="font-mono">{formatAddress(address || '')}</span>
        <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-tile-border rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-2">
            <div className="px-3 py-2 border-b border-tile-border mb-2">
              <p className="text-xs text-gray-400">Connected with {connector?.name}</p>
              <p className="text-sm font-mono text-white truncate">{address}</p>
            </div>

            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Copy size={16} />
              <span>Copy Address</span>
            </button>

            <button
              onClick={handleViewExplorer}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              <span>View on Explorer</span>
            </button>

            <hr className="border-tile-border my-2" />

            <button
              onClick={handleDisconnect}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
