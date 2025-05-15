import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { api, decryptSecretWithWallet } from '@/lib/api';
import { useWalletEncryption } from './use-wallet-encryption';
import { deriveEncryptionKey, SIGNATURE_MESSAGE } from '@/lib/wallet-auth';

interface SecretData {
  id: string;
  name: string;
  value: string;
  type: string;
}

interface EncryptedSecret {
  id: string;
  name: string;
  type: string;
  encrypted_value: string;
  iv: string;
  auth_tag: string;
}

export function useSecretDecryption() {
  const [decryptedSecrets, setDecryptedSecrets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { publicKey, signMessage } = useWallet();
  const { isInitialized } = useWalletEncryption();

  /**
   * Sign a message to authenticate the request
   */
  const signAuthMessage = async (): Promise<string | null> => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or signing not available');
    }

    try {
      // Create a message to sign for authentication
      const message = new TextEncoder().encode('auth-to-decrypt');
      const signature = await signMessage(message);
      const signatureBase64 = Buffer.from(signature).toString('base64');
      
      // THIS IS THE CRITICAL ADDITION - derive and store the encryption key
      try {
        await deriveEncryptionKey('auth-to-decrypt', signatureBase64);
        console.log("Encryption key derived successfully from signature");
      } catch (derivationError) {
        console.error("Failed to derive encryption key:", derivationError);
        // Still proceed with API call as this might be a different issue
      }
      
      return signatureBase64;
    } catch (error) {
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new Error('Message signing was cancelled by user');
      }
      throw new Error('Failed to sign message');
    }
  };

  /**
   * Decrypt a secret with the wallet-derived key
   */
  const decryptSecret = async (secretId: string): Promise<string> => {
    // Update loading state
    setLoading(prev => ({ ...prev, [secretId]: true }));
    setErrors(prev => ({ ...prev, [secretId]: '' }));

    try {
      // Check if already decrypted
      if (decryptedSecrets[secretId]) {
        return decryptedSecrets[secretId];
      }

      // Validate wallet state - we don't need to check isInitialized here
      // since the signing process will be handled by the UI component
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Sign message for authentication
      const signature = await signAuthMessage();
      if (!signature) {
        throw new Error('Failed to get signature');
      }

      try {
        // CRITICAL: Verify encryption key exists in localStorage
        const encryptionKey = localStorage.getItem('solkey:encryption-key');
        if (!encryptionKey) {
          console.log('Encryption key not found in localStorage, attempting to derive it...');
          
          // Try to derive it from the signature we just got
          try {
            await deriveEncryptionKey(SIGNATURE_MESSAGE, signature);
            console.log('Successfully derived and stored encryption key');
          } catch (derivationError) {
            console.error('Failed to derive encryption key:', derivationError);
            throw new Error('Failed to derive encryption key from signature');
          }
        } else {
          console.log('Encryption key found in localStorage, proceeding with decryption');
        }
        
        // Use the API's decrypt method which handles both fetching and decrypting
        const result = await api.secrets.decrypt(secretId, {
          walletAddress: publicKey.toBase58(),
          signature
        });
        
        // Store the decrypted value
        setDecryptedSecrets(prev => ({
          ...prev,
          [secretId]: result.value
        }));
  
        return result.value;
      } catch (error) {
        // Handle specific API errors
        if (error instanceof Error) {
          if (error.message.includes('Encryption key not available')) {
            throw new Error('Authentication required. Your wallet signature is needed to access this secret.');
          }
          throw error;
        }
        throw new Error('Failed to decrypt secret');
      }
    } catch (error) {
      // Process and categorize the error message
      let errorMessage = 'Unknown error during decryption';
      
      if (error instanceof Error) {
        if (error.message.includes('Encryption key not available')) {
          errorMessage = 'Encryption key not available. Please sign with your wallet first.';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'You cancelled the signature request. Authentication is required to decrypt.';
        } else if (error.message.includes('signature verification failed')) {
          errorMessage = 'Signature verification failed. Please try again.';
        } else if (error.message.includes('Failed to fetch encrypted secret')) {
          errorMessage = 'Unable to retrieve encrypted data from server. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors(prev => ({ ...prev, [secretId]: errorMessage }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [secretId]: false }));
    }
  };

  /**
   * Forget a decrypted secret (for security)
   */
  const forgetSecret = (secretId: string) => {
    setDecryptedSecrets(prev => {
      const newState = { ...prev };
      delete newState[secretId];
      return newState;
    });
  };

  /**
   * Check if a secret is already decrypted
   */
  const isDecrypted = (secretId: string): boolean => {
    return !!decryptedSecrets[secretId];
  };

  /**
   * Clear all decrypted secrets
   */
  const clearAllSecrets = () => {
    setDecryptedSecrets({});
  };

  /**
   * Clear any error for a specific secret
   */
  const clearError = (secretId: string) => {
    setErrors(prev => ({ ...prev, [secretId]: '' }));
  };

  return {
    decryptSecret,
    forgetSecret,
    isDecrypted,
    clearAllSecrets,
    clearError,
    decryptedSecrets,
    loading,
    errors
  };
}