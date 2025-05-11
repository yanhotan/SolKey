"use client"

import { FC, ReactNode } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WALLET_CONFIG, SOLANA_CONFIG } from '@/lib/wallet-adapter'

import '@solana/wallet-adapter-react-ui/styles.css'

interface WalletConfigProviderProps {
  children: ReactNode
}

export const WalletConfigProvider: FC<WalletConfigProviderProps> = ({ children }) => {
  // Since WALLET_CONFIG is now a constant object, we don't need useMemo here
  return (
    <ConnectionProvider endpoint={WALLET_CONFIG.endpoint} config={SOLANA_CONFIG}>
      <WalletProvider wallets={WALLET_CONFIG.wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
