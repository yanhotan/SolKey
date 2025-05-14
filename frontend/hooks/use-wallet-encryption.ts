"use client"

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { deriveEncryptionKey as cryptoDeriveEncryptionKey, encryptData, decryptData, clearEncryptionKey, hasEncryptionKey } from '../lib/crypto';
import { deriveEncryptionKey as walletAuthDeriveEncryptionKey } from '../lib/wallet-auth';
import bs58 from 'bs58';
import { WALLET_CONFIG } from '../lib/wallet-adapter';

export interface UseWalletEncryptionReturn {
  isInitialized: boolean;
  handleSignMessage: () => Promise<CryptoKey>;
  encryptData: (data: string) => Promise<any>;
  decryptData: (encryptedData: any) => Promise<string | null>;
  error: string | null;
}

// Storage keys
const WALLET_ADDRESS_STORAGE_KEY = 'solkey:walletAddress';
const ENCRYPTION_KEY_STORAGE_KEY = 'solkey:encryption-key';

export function useWalletEncryption(): UseWalletEncryptionReturn {
  const { publicKey, signMessage, connected } = useWallet();
  const [isInitialized, setIsInitialized] = useState(checkIfInitialized());
  const [error, setError] = useState<string | null>(null);

  function checkIfInitialized(): boolean {
    // Check both memory state AND localStorage for encryption key
    return hasEncryptionKey() || !!localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
  }

  // Check if wallet is initialized on mount and when connection changes
  useEffect(() => {
    if (!connected) {
      clearEncryptionKey();
      localStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
      localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
      setIsInitialized(false);
    } else {
      setIsInitialized(checkIfInitialized());
    }
  }, [connected]);

  // Store wallet address when publicKey changes
  useEffect(() => {
    if (connected && publicKey) {
      localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, publicKey.toBase58());
    }
  }, [connected, publicKey]);

  const handleSignMessage = useCallback(async () => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not connected');
      throw new Error('Please connect your wallet first');
    }

    try {
      setError(null);
      
      // Always store the wallet address
      localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, publicKey.toBase58());
      
      // Sign the message - using the standard auth-to-decrypt message
      const message = new TextEncoder().encode(WALLET_CONFIG.signatureMessage);
      const signature = await signMessage(message);
      const signatureBase58 = bs58.encode(signature);
      
      console.log("Message signed successfully, deriving encryption key");
      
      // Use wallet-auth's deriveEncryptionKey to ensure consistent key storage
      const key = await walletAuthDeriveEncryptionKey(WALLET_CONFIG.signatureMessage, signatureBase58);
      
      // Verify the key was stored properly
      if (!localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY)) {
        console.error("Key not properly stored in localStorage after derivation");
        throw new Error("Failed to store encryption key");
      }
      
      console.log("Encryption key derived and stored successfully");
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
    isInitialized: checkIfInitialized(), // Always check real-time status
    handleSignMessage,
    encryptData: handleEncryptData,
    decryptData: handleDecryptData,
    error
  };
}
