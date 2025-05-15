import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export interface EncryptedData {
  encrypted: string;
  nonce: string;
  authHash: string;
}

// Store encryption key in memory (not persisted)
let encryptionKey: CryptoKey | null = null;

/**
 * Derive encryption key from wallet signature
 */
export async function deriveEncryptionKey(message: string, signature: string): Promise<CryptoKey> {
  try {
    // Import the signature as key material
    const signatureBytes = new TextEncoder().encode(signature);
    const messageBytes = new TextEncoder().encode(message);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new Uint8Array([...messageBytes, ...signatureBytes]),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive a key using PBKDF2 with high iteration count
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('solkey-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    encryptionKey = key;
    return key;
  } catch (error) {
    console.error("Failed to derive encryption key:", error);
    throw new Error("Failed to derive encryption key");
  }
}

/**
 * Encrypt data using the wallet-derived key
 */
export async function encryptData(data: string): Promise<EncryptedData> {
  if (!encryptionKey) {
    throw new Error("No encryption key available. Please connect your wallet and sign message first.");
  }

  if (typeof data !== 'string') {
    throw new Error("Data must be a string");
  }

  try {
    // Convert string to bytes
    const messageBytes = new TextEncoder().encode(data);
    if (messageBytes.length === 0) {
      throw new Error("Empty data cannot be encrypted");
    }
    
    // Generate nonce and authentication data
    const nonce = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for AES-GCM
    const authData = new TextEncoder().encode('solkey-encrypted-data');

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: authData
      },
      encryptionKey,
      messageBytes
    ).catch(error => {
      console.error('Encryption operation failed:', error);
      throw new Error('Failed to encrypt data');
    });

    // Generate auth hash
    const authHash = await crypto.subtle.digest('SHA-256', authData)
      .catch(error => {
        console.error('Auth hash generation failed:', error);
        throw new Error('Failed to generate authentication hash');
      });
    
    // Convert to hex strings
    const result: EncryptedData = {
      encrypted: uint8ArrayToHex(new Uint8Array(encryptedData)),
      nonce: uint8ArrayToHex(nonce),
      authHash: uint8ArrayToHex(new Uint8Array(authHash))
    };

    // Validate the encrypted data format before returning
    if (!validateEncryptedData(result)) {
      console.error('Invalid encrypted data format generated:', result);
      throw new Error('Generated invalid encrypted data format');
    }

    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error instanceof Error ? error : new Error('Encryption failed');
  }
}

/**
 * Validate the encrypted data format
 */
function validateEncryptedData(encrypted: any): encrypted is EncryptedData {
  return (
    typeof encrypted === 'object' &&
    encrypted !== null &&
    typeof encrypted.encrypted === 'string' &&
    typeof encrypted.nonce === 'string' &&
    typeof encrypted.authHash === 'string' &&
    encrypted.encrypted.length > 0 &&
    encrypted.nonce.length > 0 &&
    encrypted.authHash.length > 0
  );
}

/**
 * Decrypt data using the wallet-derived key
 */
export async function decryptData(encrypted: EncryptedData): Promise<string | null> {
  // First, validate encryption key availability
  if (!encryptionKey) {
    throw new Error("No encryption key available. Please connect your wallet and sign message first.");
  }

  try {
    // Validate input type and structure
    if (!encrypted || typeof encrypted !== 'object') {
      console.error('Invalid encrypted data type:', typeof encrypted);
      throw new Error('Invalid encrypted data format');
    }

    // Use type guard to validate encrypted data format
    if (!validateEncryptedData(encrypted)) {
      console.error('Missing or invalid encrypted data fields:', encrypted);
      throw new Error('Invalid encrypted data format');
    }

    // Convert hex strings to Uint8Arrays with validation
    let encryptedBytes: Uint8Array;
    let nonce: Uint8Array;
    try {
      if (!encrypted.encrypted.match(/^[0-9a-f]+$/i)) {
        throw new Error('Invalid hex format in encrypted data');
      }
      if (!encrypted.nonce.match(/^[0-9a-f]+$/i)) {
        throw new Error('Invalid hex format in nonce');
      }
      encryptedBytes = hexToUint8Array(encrypted.encrypted);
      nonce = hexToUint8Array(encrypted.nonce);

      // Validate lengths
      if (nonce.length !== 12) { // AES-GCM requires 12 bytes nonce
        throw new Error('Invalid nonce length');
      }
      if (encryptedBytes.length === 0) {
        throw new Error('Empty encrypted data');
      }
    } catch (error) {
      console.error('Failed to decode encrypted data:', error);
      throw new Error('Invalid encrypted data encoding');
    }

    // Verify data integrity
    const authData = new TextEncoder().encode('solkey-encrypted-data');
    const authHash = await crypto.subtle.digest('SHA-256', authData);
    const expectedAuthHash = uint8ArrayToHex(new Uint8Array(authHash));

    if (encrypted.authHash !== expectedAuthHash) {
      console.error('Auth hash mismatch:', { 
        expected: expectedAuthHash, 
        received: encrypted.authHash 
      });
      throw new Error('Data integrity check failed');
    }

    // Attempt decryption
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: authData
      },
      encryptionKey,
      encryptedBytes
    ).catch(error => {
      console.error('Decryption operation failed:', error);
      throw new Error('Failed to decrypt data');
    });

    // Validate and decode the decrypted data
    if (!(decrypted instanceof ArrayBuffer)) {
      throw new Error('Unexpected decryption result type');
    }

    const result = new TextDecoder().decode(decrypted);
    if (!result) {
      throw new Error('Decryption resulted in empty data');
    }

    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    if (error instanceof Error) {
      // Preserve the original error message
      throw error;
    } else {
      throw new Error('Decryption failed');
    }
  }
}

/**
 * Clear the encryption key (e.g., on logout)
 */
export function clearEncryptionKey(): void {
  encryptionKey = null;
}

/**
 * Check if encryption key is available
 */
export function hasEncryptionKey(): boolean {
  return encryptionKey !== null;
}

/**
 * Get the current encryption key or throw if not available
 */
export function getEncryptionKey(): CryptoKey {
  if (!encryptionKey) {
    throw new Error("Encryption key not available. Please connect wallet and sign message first.");
  }
  return encryptionKey;
}

// Helper function to convert Uint8Array to hex string
function uint8ArrayToHex(arr: Uint8Array): string {
  return bytesToHex(arr);
}

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}
