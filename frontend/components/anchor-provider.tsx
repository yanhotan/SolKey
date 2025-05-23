'use client';

import { ReactNode, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { ConfirmOptions, Transaction, VersionedTransaction } from '@solana/web3.js';

// Create a React context to provide the Anchor Provider
export function useAnchorProviderContext() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // Only create the provider when the wallet is connected
  const anchorProvider = useMemo(() => {
    if (!wallet || !connection || !wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    
    const opts: ConfirmOptions = {
      preflightCommitment: 'processed',
      commitment: 'processed',
    };
    
    // Create the AnchorProvider with a properly formatted wallet adapter
    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
          if (!wallet.signTransaction) {
            throw new Error("Wallet doesn't support signing");
          }
          return wallet.signTransaction(tx);
        },
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
          if (!wallet.signAllTransactions) {
            throw new Error("Wallet doesn't support signing multiple transactions");
          }
          return wallet.signAllTransactions(txs);
        }
      },
      opts
    );
  }, [connection, wallet]);
  
  return anchorProvider;
} 