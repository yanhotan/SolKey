'use client'

import { PropsWithChildren } from 'react'
import { WalletConfig } from '@/components/providers/wallet-provider'
import { AnchorProvider, useAnchorProvider } from '@/components/providers/anchor-provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <WalletConfig>
      <AnchorProvider>
        {children}
      </AnchorProvider>
    </WalletConfig>
  )
}

// Export providers and hooks for easy access
export { useAnchorProvider }
export { WalletConfig } 