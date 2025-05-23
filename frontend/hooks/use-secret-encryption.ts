"use client"

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  generateEncryptionKey, 
  exportKeyToBase64, 
  importKeyFromBase64,
  encryptData as encryptWithKey,
  decryptData as decryptWithKey,
  EncryptedData
} from '@/lib/crypto';
import { 
  encryptAesKeyForWallet,
  decryptAesKeyWithSignature
} from '@/lib/wallet-crypto';
import { toast } from '@/components/ui/use-toast';
import * as nacl from 'tweetnacl';

// Types
type SecretType = 'String' | 'Password' | 'ApiKey' | 'JSON' | 'Array';

interface SecretData {
  name: string;
  value: string;
  type: SecretType;
  projectId?: string;
  environmentId?: string;
}

interface DecryptedSecret {
  id: string;
  name: string;
  type: string;
  value: string;
  projectId?: string;
  environmentId?: string;
}

// Following schema.sql structure for the secrets table
interface SecretRecord {
  id: string;
  project_id: string;
  environment_id: string;
  name: string;
  encrypted_value: string;
  type: string;
  iv: string;
  created_at?: string;
  updated_at?: string;
}

// Following schema.sql structure for the secret_keys table
interface SecretKeyRecord {
  id?: string;
  secret_id: string;
  wallet_address: string;
  encrypted_aes_key: string;
  nonce: string;
  ephemeral_public_key: string;
  created_at?: string;
}

// Combined response for the frontend
interface SecretResponse {
  id?: string;
  name: string;
  encrypted_value: string;
  iv: string;
  type: string;
  project_id?: string;
  environment_id?: string;
  encrypted_aes_key: string;
  nonce: string;
  ephemeral_public_key: string;
}

// List item for secrets metadata
interface SecretMetadata {
  id: string;
  name: string;
  type: string;
  projectName: string;
  environmentName: string;
}

interface UseSecretEncryptionReturn {
  createSecret: (data: SecretData) => Promise<string | null>;
  fetchSecret: (secretId: string) => Promise<EncryptedData | null>;
  decryptSecret: (encryptedData: EncryptedData) => Promise<DecryptedSecret | null>;
  fetchSecretsByWallet: () => Promise<SecretMetadata[]>;
  isLoading: boolean;
  error: string | null;
}

// A cache to store secret data between fetch and decrypt
const secretDataCache = new Map<string, SecretResponse>();

export function useSecretEncryption(): UseSecretEncryptionReturn {
  const { publicKey, signMessage, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new secret with frontend encryption
  const createSecret = useCallback(async (data: SecretData): Promise<string | null> => {
    if (!connected || !publicKey || !signMessage) {
      setError('Wallet not connected or signing not available');
      return null;
    }

    if (!data.projectId || !data.environmentId) {
      setError('Project ID and Environment ID are required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a random AES key for this secret
      const key = await generateEncryptionKey();
      
      // Export the key as raw bytes for storing
      const rawKey = await window.crypto.subtle.exportKey('raw', key);
      const keyBytes = new Uint8Array(rawKey);
      
      // Sign a message to derive a deterministic key that will be consistent for decryption
      const seedMessage = new TextEncoder().encode('derive-decryption-key');
      let seedSignature: Uint8Array;
      
      try {
        // Request the user to sign a message to derive a encryption/decryption key
        seedSignature = await signMessage(seedMessage);
        console.log('✅ Seed message signed successfully for encryption', {
          signatureLength: seedSignature.length
        });
      } catch (signError) {
        console.error('❌ User rejected signature request:', signError);
        throw new Error('User declined to sign the key derivation message');
      }
      
      // Encrypt the secret value with the AES key
      const encryptedData = await encryptWithKey(data.value, key);      // Now encrypt the AES key with the user's wallet public key
      // Pass the signature to use the same deterministic key that will be used for decryption
      const encryptedKeyData = encryptAesKeyForWallet(
        keyBytes,
        publicKey.toBase58(),
        seedSignature // Pass the signature to use the same key derivation as in decryption
      );
        // Prepare data for API following schema.sql structure
      const secretData = {
        // Secret data
        name: data.name,
        type: data.type,
        encrypted_value: encryptedData.encrypted,
        iv: encryptedData.iv,
        project_id: data.projectId,
        environment_id: data.environmentId,
        
        // Secret key data
        wallet_address: publicKey.toBase58(), // Keep as wallet_address as backend expects it with underscore
        encrypted_aes_key: encryptedKeyData.encryptedKey,
        nonce: encryptedKeyData.nonce,
        ephemeral_public_key: encryptedKeyData.ephemeralPublicKey
      };
      
      console.log("Sending secret data to backend:", {
        name: secretData.name,
        type: secretData.type,
        project_id: secretData.project_id,
        environment_id: secretData.environment_id,
        has_encrypted_value: !!secretData.encrypted_value,
        has_iv: !!secretData.iv,
        wallet_address_length: secretData.wallet_address.length,
        has_encryption_keys: !!secretData.encrypted_aes_key && !!secretData.nonce && !!secretData.ephemeral_public_key
      });      // Send to backend for storage
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      console.log(`Sending POST request to ${apiUrl}/api/secrets`);
      
      const response = await fetch(`${apiUrl}/api/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secretData),
      });

      console.log(`Received response with status: ${response.status}`);
      
      if (!response.ok) {
        // Try to extract the error details from the response
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
          console.error('Server error response:', errorData);
        } catch (e) {
          // If it's not JSON, use the raw text
          console.error('Server error (raw):', errorText);
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(errorData.error || `Failed to create secret: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: 'Secret created',
        description: `Successfully created secret: ${data.name}`,
      });
      
      return result.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create secret';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, signMessage]);

  // Fetch encrypted secret data from the backend
  const fetchSecret = useCallback(async (secretId: string): Promise<EncryptedData | null> => {
    if (!connected || !publicKey || !signMessage) {
      setError('Wallet not connected or signature not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First sign an authentication message with the wallet
      const message = new TextEncoder().encode('auth-to-decrypt');
      let signature: Uint8Array;
      
      try {
        // Request the user to sign with their wallet
        signature = await signMessage(message);
        console.log('✅ Message signed successfully', {
          signatureLength: signature.length,
          message: 'auth-to-decrypt'
        });
      } catch (signError) {
        console.error('❌ User rejected signature request:', signError);
        throw new Error('User declined to sign the authentication message');
      }
        // Fetch encrypted data from backend with signature authentication
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/api/secrets/${secretId}/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(), // Using camelCase as backend expects
          signature: Buffer.from(signature).toString('base64') //Optional?
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch secret: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.encrypted_value || !data.iv) {
        throw new Error('Invalid or missing encrypted data from server');
      }
      
      console.log('Received encrypted data:', {
        encryptedValueLength: data.encrypted_value.length,
        ivLength: data.iv.length,
        hasEncryptionKeys: !!data.encrypted_aes_key && !!data.nonce && !!data.ephemeral_public_key
      });

      // Store the full secret data in cache for later decryption
      secretDataCache.set(secretId, data);

      return {
        encrypted: data.encrypted_value,
        iv: data.iv,
        // authTag field is no longer used
        authTag: ''
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch secret';
      setError(errorMessage);
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, signMessage]);

  // Fetch all secrets accessible by this wallet
  const fetchSecretsByWallet = useCallback(async (): Promise<SecretMetadata[]> => {
    if (!connected || !publicKey) {
      setError('Wallet not connected');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {      // Fetch secrets metadata for this wallet
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      // Make sure we use the correct parameter name as expected by the backend (walletAddress)
      const response = await fetch(`${apiUrl}/api/secrets/metadata?walletAddress=${publicKey.toBase58()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch secrets: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.secrets || !Array.isArray(data.secrets)) {
        return [];
      }

      return data.secrets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch secrets';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  // Decrypt a secret using the wallet and cached key information
  const decryptSecret = useCallback(async (encryptedData: EncryptedData): Promise<DecryptedSecret | null> => {
    if (!connected || !publicKey || !signMessage) {
      setError('Wallet not connected or signature not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Look up the secret info based on encrypted data
      let secretInfo: SecretResponse | undefined;
      
      // Find the matching secret in the cache
      for (const [id, data] of secretDataCache.entries()) {
        if (data.encrypted_value === encryptedData.encrypted && data.iv === encryptedData.iv) {
          secretInfo = data;
          break;
        }
      }
      
      if (!secretInfo) {
        throw new Error('Secret data not found in cache - fetch the secret first');
      }
      
      // Verify we have the encryption key data
      if (!secretInfo.encrypted_aes_key || !secretInfo.nonce || !secretInfo.ephemeral_public_key) {
        throw new Error('Missing encryption key data - cannot decrypt');
      }
      
      console.log(' Preparing to decrypt with wallet', {
        encryptedAesKeyLength: secretInfo.encrypted_aes_key.length,
        nonceLength: secretInfo.nonce.length,
        ephemeralPubKeyLength: secretInfo.ephemeral_public_key.length
      });
      
      // Use the SAME SEED MESSAGE as in encryption to ensure consistent key derivation
      const seedMessage = new TextEncoder().encode('derive-decryption-key');
      let seedSignature: Uint8Array;
      
      try {
        // Request the user to sign a message to derive a decryption key
        // This must match the message used during encryption
        seedSignature = await signMessage(seedMessage);
        console.log('✅ Seed message signed successfully', {
          signatureLength: seedSignature.length
        });
      } catch (signError) {
        console.error('❌ User rejected signature request:', signError);
        throw new Error('User declined to sign the decryption key derivation message');
      }
      
      // Use the signature to decrypt the AES key
      console.log(' Decrypting AES key with signature-derived key');
      
      let aesKeyBytes: Uint8Array;
      try {
        // Use our signature-based decryption with the same signature seed as encryption
        aesKeyBytes = decryptAesKeyWithSignature(
          secretInfo.encrypted_aes_key,
          secretInfo.nonce,
          secretInfo.ephemeral_public_key,
          seedSignature
        );
        
        console.log('✅ AES key decrypted successfully', {
          keyLength: aesKeyBytes.length
        });
      } catch (decryptError) {
        console.error('❌ Failed to decrypt AES key:', decryptError);
        throw new Error('Failed to decrypt the encryption key');
      }
      
      // Import the AES key into WebCrypto
      let aesKey: CryptoKey;
      try {
        // Import the decrypted AES key bytes as an AES-GCM key
        aesKey = await window.crypto.subtle.importKey(
          'raw',
          aesKeyBytes,
          {
            name: 'AES-GCM',
            length: 256
          },
          false, // not extractable
          ['decrypt']
        );
        
        console.log('✅ AES key imported successfully');
      } catch (keyError) {
        console.error('❌ Failed to import AES key:', keyError);
        throw new Error('Failed to prepare decryption key');
      }
      
      // Decrypt the data
      console.log(' Decrypting secret data with AES key');
      const decryptedValue = await decryptWithKey({
        encrypted: secretInfo.encrypted_value,
        iv: secretInfo.iv,
        authTag: ''
      }, aesKey);
      
      console.log('✅ Secret decrypted successfully');

      // Create a decrypted secret object
      const decryptedSecret: DecryptedSecret = {
        id: secretInfo.id || 'unknown',
        name: secretInfo.name,
        type: secretInfo.type,
        value: decryptedValue,
        projectId: secretInfo.project_id,
        environmentId: secretInfo.environment_id
      };
      
      return decryptedSecret;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt secret';
      setError(errorMessage);
      toast({
        title: 'Decryption Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, signMessage]);

  return {
    createSecret,
    fetchSecret,
    decryptSecret,
    fetchSecretsByWallet,
    isLoading,
    error
  };
}