import { sha256 } from "@noble/hashes/sha256"
import { bytesToHex } from "@noble/hashes/utils"

// The message that will be signed by the wallet
export const SIGNATURE_MESSAGE = "auth-to-decrypt"

// Solana network to use
export const SOLANA_NETWORK = "devnet"

// Storage keys for persisted data
const STORAGE_KEY_PREFIX = 'solkey'
const ENCRYPTION_KEY_STORAGE_KEY = `${STORAGE_KEY_PREFIX}:encryption-key`
const SIGNATURE_STORAGE_KEY = `${STORAGE_KEY_PREFIX}:signature`

// Interface for wallet connection providers
export interface WalletAdapter {
  publicKey: string | null
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
  connected: boolean
}

// Store the derived encryption key in memory (not persisted)
let encryptionKey: CryptoKey | null = null;

/**
 * Save the signature and encryption key to localStorage
 */
async function persistEncryptionData(message: string, signature: string, key: CryptoKey): Promise<void> {
  try {
    // Store signature
    localStorage.setItem(SIGNATURE_STORAGE_KEY, signature);
    
    // Export and store key
    const rawKey = await crypto.subtle.exportKey('raw', key);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyBase64);
    
    console.log('Encryption data persisted to localStorage');
  } catch (err) {
    console.error('Failed to persist encryption data:', err);
    // Clean up partial state
    localStorage.removeItem(SIGNATURE_STORAGE_KEY);
    localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
  }
}

/**
 * Try to restore the encryption key from localStorage
 */
async function restoreEncryptionKey(): Promise<boolean> {
  try {
    const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    if (!storedKey) return false;

    const keyBytes = Uint8Array.from(atob(storedKey).split('').map(c => c.charCodeAt(0)));
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    encryptionKey = key;
    console.log('Restored encryption key from localStorage');
    return true;
  } catch (err) {
    console.error('Failed to restore encryption key:', err);
    clearEncryptionKey();
    return false;
  }
}

/**
 * Request wallet signature and derive encryption key
 */
export async function deriveEncryptionKey(message: string, signature: string): Promise<CryptoKey> {
  try {
    // Input validation
    if (!message || !signature) {
      throw new Error("Message and signature are required for encryption initialization");
    }

    // Try to restore existing key first
    const restored = await restoreEncryptionKey();
    if (restored) {
      return getEncryptionKey();
    }

    // Normalize inputs 
    const signatureBytes = new TextEncoder().encode(signature.trim());
    const messageBytes = new TextEncoder().encode(message.trim());
    
    // Generate a more robust key hash
    const combinedBytes = new Uint8Array([...messageBytes, ...signatureBytes]);
    const keyHash = sha256(combinedBytes);
    
    // Import key material with explicit error handling
    let keyMaterial: CryptoKey;
    try {
      keyMaterial = await crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
    } catch (err) {
      clearEncryptionKey();
      throw new Error(`Failed to import key material: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Derive final key with strong parameters
    let key: CryptoKey;
    try {
      key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('solkey-salt-v1'),
          iterations: 310000, // Increased iterations for better security
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (err) {
      clearEncryptionKey();
      throw new Error(`Failed to derive key: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Store the key in memory and localStorage
    encryptionKey = key;
    await persistEncryptionData(message, signature, key);
    console.log('Successfully derived and stored encryption key');

    return key;
  } catch (error) {
    console.error("Failed to derive encryption key:", error);
    clearEncryptionKey(); // Clean up on any error
    throw error instanceof Error ? error : new Error("Failed to derive encryption key");
  }
}

/**
 * Get the current encryption key or throw if not available
 */
export function getEncryptionKey(): CryptoKey {
  if (!encryptionKey) {
    throw new Error("Encryption key not available. Please connect your wallet and sign the message first.");
  }
  return encryptionKey;
}

/**
 * Clear the encryption key (e.g., on logout)
 */
export function clearEncryptionKey(): void {
  encryptionKey = null;
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
  localStorage.removeItem(SIGNATURE_STORAGE_KEY);
  console.log('Encryption data cleared');
}

/**
 * Check if encryption key is available
 */
export function hasEncryptionKey(): boolean {
  if (encryptionKey) return true;
  // Also check localStorage
  return localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY) !== null;
}

export interface EncryptedData {
  encrypted: string
  nonce: string
  authHash: string
}

/**
 * Encrypt data using the wallet-derived key
 */
export async function encryptData(data: string): Promise<EncryptedData> {
  try {
    // Validate input
    if (!data) {
      throw new Error("Data to encrypt cannot be empty");
    }

    const key = getEncryptionKey();
    if (!key) {
      throw new Error("Encryption key not available");
    }

    const messageBytes = new TextEncoder().encode(data);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const authData = new TextEncoder().encode('solkey-encrypted-data');

    let encryptedData: ArrayBuffer;
    try {
      encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          additionalData: authData
        },
        key,
        messageBytes
      );
    } catch (err) {
      throw new Error(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Generate authentication hash
    const authHash = new Uint8Array(await crypto.subtle.digest('SHA-256', authData));
    
    return {
      encrypted: uint8ArrayToHex(new Uint8Array(encryptedData)),
      nonce: uint8ArrayToHex(nonce),
      authHash: uint8ArrayToHex(authHash)
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error instanceof Error ? error : new Error("Encryption failed");
  }
}

/**
 * Decrypt data using the wallet-derived key
 */
export async function decryptData(encrypted: EncryptedData): Promise<string | null> {
  try {
    // Input validation
    if (!encrypted || !encrypted.encrypted || !encrypted.nonce || !encrypted.authHash) {
      throw new Error('Invalid encrypted data format');
    }

    const key = getEncryptionKey();
    if (!key) {
      throw new Error("Encryption key not available");
    }

    const encryptedBytes = hexToUint8Array(encrypted.encrypted);
    const nonce = hexToUint8Array(encrypted.nonce);
    const authData = new TextEncoder().encode('solkey-encrypted-data');
    
    // Verify data integrity
    const expectedAuthHash = uint8ArrayToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', authData)));
    if (encrypted.authHash !== expectedAuthHash) {
      throw new Error('Data integrity check failed');
    }

    // Attempt decryption
    let decrypted: ArrayBuffer;
    try {
      decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          additionalData: authData
        },
        key,
        encryptedBytes
      );
    } catch (err) {
      throw new Error(`Decryption failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Helper function to convert Uint8Array to hex string
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/[0-9a-f]{2}/gi) || []
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)))
}
