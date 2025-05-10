import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { deriveEncryptionKey, TEST_MESSAGE, encrypt, decrypt } from '../lib/crypto';
import { setEncryptionKey, getEncryptionKey, hasEncryptionKey, clearEncryptionKey } from '../lib/encryption-store';
import bs58 from 'bs58';

export function useWalletEncryption() {
  const { publicKey, signMessage, connected } = useWallet();
  const [isInitialized, setIsInitialized] = useState(hasEncryptionKey());
  const [error, setError] = useState<string | null>(null);

  // Check encryption key status when wallet connection changes
  useEffect(() => {
    if (!connected) {
      clearEncryptionKey();
      setIsInitialized(false);
    } else {
      setIsInitialized(hasEncryptionKey());
    }
  }, [connected]);

  // Clean up localStorage when wallet disconnects
  useEffect(() => {
    if (!connected) {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      
      // Remove all items except encrypted data
      keys.forEach(key => {
        if (!key.startsWith('encrypted:')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [connected]);

  const handleSignMessage = useCallback(async () => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not connected:', { publicKey, signMessage });
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Starting encryption initialization...');
      setError(null);
      
      const message = new TextEncoder().encode(TEST_MESSAGE);
      console.log('Requesting signature for message:', TEST_MESSAGE);
      
      const signature = await signMessage(message);
      console.log('Got signature:', bs58.encode(signature));
      
      const key = await deriveEncryptionKey(TEST_MESSAGE, bs58.encode(signature));
      console.log('Derived encryption key');
      
      setEncryptionKey(key);
      setIsInitialized(true);
      console.log('Encryption initialized successfully');
      
      return key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize encryption';
      console.error('Encryption initialization failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [publicKey, signMessage]);

  const encryptData = useCallback(async (data: string) => {
    try {
      return await encrypt(data, getEncryptionKey());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Encryption failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const decryptData = useCallback(async (encryptedData: any) => {
    try {
      return await decrypt(encryptedData, getEncryptionKey());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Decryption failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    isInitialized,
    handleSignMessage,
    encryptData,
    decryptData,
    error
  };
}
