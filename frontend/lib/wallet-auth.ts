import { sha256 } from "@noble/hashes/sha256"
import { bytesToHex } from "@noble/hashes/utils"

// The message that will be signed by the wallet
export const SIGNATURE_MESSAGE = "Sign this message to securely access your encrypted secrets on SolSecrets"

// Solana network to use
export const SOLANA_NETWORK = "devnet"

// Interface for wallet connection providers
export interface WalletAdapter {
  publicKey: string | null
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
  connected: boolean
}

// Store the derived encryption key in memory (not persisted)
let encryptionKey: CryptoKey | null = null

/**
 * Request wallet signature and derive encryption key
 */
export async function deriveEncryptionKey(message: string, signature: string): Promise<CryptoKey> {
  try {
    // Import the signature as key material
    const signatureBytes = new TextEncoder().encode(signature)
    const messageBytes = new TextEncoder().encode(message)
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new Uint8Array([...messageBytes, ...signatureBytes]),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    // Derive a key using PBKDF2
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
    )

    // Store the key in memory
    encryptionKey = key
    console.log('Successfully derived and stored encryption key');

    return key
  } catch (error) {
    console.error("Failed to derive encryption key:", error)
    throw new Error("Failed to derive encryption key")
  }
}

/**
 * Get the current encryption key or throw if not available
 */
export function getEncryptionKey(): CryptoKey {
  if (!encryptionKey) {
    console.error('No encryption key available');
    throw new Error("Encryption key not available. Please connect your wallet and sign the message first.")
  }
  return encryptionKey
}

/**
 * Clear the encryption key (e.g., on logout)
 */
export function clearEncryptionKey(): void {
  encryptionKey = null
  console.log('Encryption key cleared');
}

/**
 * Check if encryption key is available
 */
export function hasEncryptionKey(): boolean {
  return encryptionKey !== null
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
  const key = getEncryptionKey()
  const messageBytes = new TextEncoder().encode(data)
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const authData = new TextEncoder().encode('solkey-encrypted-data')

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      additionalData: authData
    },
    key,
    messageBytes
  )

  const authHash = new Uint8Array(await crypto.subtle.digest('SHA-256', authData))
  
  return {
    encrypted: uint8ArrayToHex(new Uint8Array(encryptedData)),
    nonce: uint8ArrayToHex(nonce),
    authHash: uint8ArrayToHex(authHash)
  }
}

/**
 * Decrypt data using the wallet-derived key
 */
export async function decryptData(encrypted: EncryptedData): Promise<string | null> {
  try {
    const key = getEncryptionKey()
    const encryptedBytes = hexToUint8Array(encrypted.encrypted)
    const nonce = hexToUint8Array(encrypted.nonce)
    const authData = new TextEncoder().encode('solkey-encrypted-data')
    const expectedAuthHash = uint8ArrayToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', authData)))

    if (encrypted.authHash !== expectedAuthHash) {
      throw new Error('Data integrity check failed')
    }

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: authData
      },
      key,
      encryptedBytes
    )

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
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
