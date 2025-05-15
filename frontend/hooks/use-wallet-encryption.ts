"use client"

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { deriveEncryptionKey, encryptData, decryptData, clearEncryptionKey, hasEncryptionKey } from '../lib/crypto';
import bs58 from 'bs58';
import { WALLET_CONFIG } from '../lib/wallet-adapter';

export interface UseWalletEncryptionReturn {
  isInitialized: boolean;
  handleSignMessage: () => Promise<CryptoKey>;
  encryptData: (data: string) => Promise<any>;
  decryptData: (encryptedData: any) => Promise<string | null>;
  error: string | null;
}

export function useWalletEncryption(): UseWalletEncryptionReturn {
  const { publicKey, signMessage, connected } = useWallet();
  const [isInitialized, setIsInitialized] = useState(hasEncryptionKey());
  const [error, setError] = useState<string | null>(null);

  // Clear encryption key and state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      clearEncryptionKey();
      setIsInitialized(false);
    } else {
      setIsInitialized(hasEncryptionKey());
    }
  }, [connected]);

  const handleSignMessage = useCallback(async () => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not connected');
      throw new Error('Please connect your wallet first');
    }

    try {
      setError(null);
      const message = new TextEncoder().encode(WALLET_CONFIG.signatureMessage);
      const signature = await signMessage(message);
      const key = await deriveEncryptionKey(WALLET_CONFIG.signatureMessage, bs58.encode(signature));
      setIsInitialized(true);
      return key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize encryption';
      setError(errorMessage);
      throw err;
    }
  }, [publicKey, signMessage]);

  const handleEncryptData = useCallback(async (data: string) => {
    try {
      return await encryptData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Encryption failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const handleDecryptData = useCallback(async (encryptedData: any) => {
    try {
      return await decryptData(encryptedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Decryption failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    isInitialized,
    handleSignMessage,
    encryptData: handleEncryptData,
    decryptData: handleDecryptData,
    error
  };
}
