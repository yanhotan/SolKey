"use client"

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  generateEncryptionKey, 
  exportKeyToBase64, 
  importKeyFromBase64,
  encryptData, 
  decryptData
} from '../lib/crypto';
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
  const { publicKey, connected, signMessage } = useWallet();
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function checkIfInitialized(): boolean {
    // Check both memory state AND localStorage for encryption key
    return !!encryptionKey || !!localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
  }

  // Check if wallet is initialized on mount and when connection changes
  useEffect(() => {
    if (!connected) {
      setEncryptionKey(null);
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
      
      // Add debug info to verify the key was stored properly
      const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
      
      if (!storedKey) {
        console.error("💥 Critical error: Key not properly stored in localStorage after derivation");
        throw new Error("Failed to store encryption key");
      }
      
      // Store the key in memory state too
      try {
        const importedKey = await importKeyFromBase64(storedKey);
        setEncryptionKey(importedKey);
      } catch (err) {
        console.warn("⚠️ Could not import stored key:", err);
      }
      
      // Debug key information
      try {
        const keyBytes = new Uint8Array(atob(storedKey).split('').map(c => c.charCodeAt(0)));
        console.log("🔑 Derived encryption key details:", {
          keyLength: keyBytes.length,
          keyBytesCorrect: keyBytes.length === 32,
          firstFourBytes: Array.from(keyBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')
        });
      } catch (err) {
        console.warn("⚠️ Could not debug key bytes:", err);
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
      // Get the encryption key - either from state or localStorage
      let key = encryptionKey;
      if (!key) {
        const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
        if (!storedKey) {
          throw new Error("No encryption key available. Please connect your wallet and sign first.");
        }
        key = await importKeyFromBase64(storedKey);
      }
      
      return await encryptData(data, key);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Encryption failed';
      setError(errorMessage);
      throw err;
    }
  }, [encryptionKey]);

  const handleDecryptData = useCallback(async (encryptedData: any) => {
    try {
      // Get the encryption key - either from state or localStorage
      let key = encryptionKey;
      if (!key) {
        const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
        if (!storedKey) {
          throw new Error("No encryption key available. Please connect your wallet and sign first.");
        }
        key = await importKeyFromBase64(storedKey);
      }
      
      return await decryptData(encryptedData, key);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Decryption failed';
      setError(errorMessage);
      throw err;
    }
  }, [encryptionKey]);

  return {
    isInitialized: checkIfInitialized(), // Always check real-time status
    handleSignMessage,
    encryptData: handleEncryptData,
    decryptData: handleDecryptData,
    error
  };
}
