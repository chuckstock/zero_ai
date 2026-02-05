import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})

export const WORD_DUEL_CONTRACT = '0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443' as const
