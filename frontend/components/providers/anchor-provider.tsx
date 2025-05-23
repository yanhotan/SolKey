'use client'

import { AnchorProvider as SolanaAnchorProvider } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Commitment, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js'
import { createContext, useContext, useMemo, PropsWithChildren } from 'react'

const AnchorProviderContext = createContext<SolanaAnchorProvider | null>(null)

export function useAnchorProvider() {
  const context = useContext(AnchorProviderContext)
  if (!context) {
    throw new Error('useAnchorProvider must be used within an AnchorProvider')
  }
  return context
}

interface ValidWallet {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
}

// Type guard to ensure wallet has required methods
function isValidWallet(wallet: any): wallet is ValidWallet {
  return (
    wallet.publicKey instanceof PublicKey &&
    typeof wallet.signTransaction === 'function' &&
    typeof wallet.signAllTransactions === 'function'
  )
}

export function AnchorProvider({ children }: PropsWithChildren) {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
    if (!isValidWallet(wallet)) {
      return null
    }

    // At this point TypeScript knows wallet has all required properties with correct types
    return new SolanaAnchorProvider(
      connection,
      wallet,
      {
        preflightCommitment: 'processed' as Commitment,
        commitment: 'processed' as Commitment,
      }
    )
  }, [connection, wallet])

  return (
    <AnchorProviderContext.Provider value={provider}>
      {children}
    </AnchorProviderContext.Provider>
  )
} 