'use client'

// Import polyfills first
import '@/lib/polyfills.js'
import { PropsWithChildren, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

const WalletProviders = dynamic(
  () => import("@/components/providers").then(mod => mod.Providers),
  { ssr: false }
)

const SafeConnectionProvider = dynamic(
  () => import("@/components/safe-connection-provider"),
  { ssr: false }
)

export function ClientProviders({ children }: PropsWithChildren) {
  // Set to 'mainnet-beta', 'testnet', or 'devnet'
  const network = WalletAdapterNetwork.Devnet;
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  return (
    <SafeConnectionProvider endpoint={endpoint}>
      <WalletProviders>
        {children}
      </WalletProviders>
    </SafeConnectionProvider>
  )
}
