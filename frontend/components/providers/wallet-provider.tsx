"use client"

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl, Commitment } from '@solana/web3.js'
import { useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

export function WalletConfig({ children }: { children: React.ReactNode }) {
  // Set to 'mainnet-beta', 'testnet', or 'devnet'
  const network = WalletAdapterNetwork.Devnet
  
  // You can also provide a custom RPC endpoint with proper config
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  
  // Connection config with proper typing
  const config = useMemo(() => ({
    commitment: 'confirmed' as Commitment,
    confirmTransactionInitialTimeout: 60000
  }), [])
  
  // Initialize wallets with error handling
  const wallets = useMemo(
    () => {
      try {
        return [
          new PhantomWalletAdapter({ network }),
          new SolflareWalletAdapter({ network }),
        ]
      } catch (error) {
        console.error('Error initializing wallet adapters:', error)
        return []
      }
    },
    [network]
  )

  // Add error boundary for wallet connection issues
  const onError = (error: Error) => {
    console.error('Wallet error:', error)
  }
  
  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={onError}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
