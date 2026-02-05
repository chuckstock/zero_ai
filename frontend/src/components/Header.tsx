import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { sepolia } from 'wagmi/chains'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })

  return (
    <header className="border-b border-[#3a3a3c] py-4">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚔️</div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider">WORD DUEL</h1>
            <p className="text-xs text-gray-500">Multiplayer Word Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Sepolia
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <div className="text-xs text-gray-500">
                  {balance ? `${Number(balance.formatted).toFixed(4)} ETH` : '...'}
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold disabled:opacity-50"
                >
                  {isPending ? 'Connecting...' : `Connect ${connector.name}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
