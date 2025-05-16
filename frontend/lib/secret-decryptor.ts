/**
 * This is a standalone module for handling secret decryption
 * with proper format handling between backend and frontend.
 * 
 * Key format differences between Node.js and WebCrypto:
 * 1. Node.js crypto (backend):
 *    - Now combines ciphertext and authTag before base64 encoding
 *    - Stores IV as hex string
 *    - Still provides authTag as hex string for backward compatibility
 * 
 * 2. WebCrypto API (frontend):
 *    - Expects binary data (Uint8Array) for all inputs
 */

/**
 * Enhanced secret decryptor module for the new end-to-end encryption flow
 * 
 * This module handles:
 * 1. Converting base64/hex encoded values to binary
 * 2. Decrypting AES key with wallet's X25519 private key
 * 3. Using AES key to decrypt the actual secret
 */

import { decryptAesKeyWithWallet } from './wallet-crypto';
import { importKeyFromBase64 } from './crypto';
import bs58 from 'bs58';

/**
 * Convert a hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  try {
    // Remove any non-hex characters (like spaces or 0x prefix)
    const cleanHex = hex.replace(/[^0-9a-f]/gi, '');
    
    // Ensure even length
    let paddedHex = cleanHex;
    if (cleanHex.length % 2 !== 0) {
      paddedHex = '0' + cleanHex;
    }
    
    // Convert to bytes
    const matches = paddedHex.match(/[0-9a-f]{2}/gi) || [];
    const bytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    
    console.log(`Converted hex string length ${cleanHex.length} to Uint8Array length ${bytes.length}`);
    return bytes;
  } catch (error) {
    console.error("Hex conversion error:", error);
    throw new Error("Failed to convert hex to binary");
  }
}

/**
 * Convert a base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Base64 decoding error:", error);
    throw new Error("Failed to decode base64 data");
  }
}

/**
 * Decrypt a secret value using the wallet-derived encryption key
 * This is the main function for the new end-to-end encryption flow
 * 
 * @param encryptedValue - Base64 encoded encrypted value
 * @param iv - Hex string IV 
 * @param encryptedAesKey - Base64 encoded AES key encrypted with wallet's public key
 * @param nonce - Base64 encoded nonce used for AES key encryption
 * @param ephemeralPublicKey - Base64 encoded ephemeral public key
 * @param walletPrivateKey - Wallet's private key bytes
 * @returns The decrypted plaintext
 */
export async function decryptSecretWithWallet(
  encryptedValue: string,
  iv: string,
  encryptedAesKey: string,
  nonce: string,
  ephemeralPublicKey: string,
  walletPrivateKey: Uint8Array
): Promise<string> {
  try {
    // Debug logging
    console.log("Starting decryption with wallet key:", {
      encryptedValueLength: encryptedValue?.length, 
      ivLength: iv?.length,
      encryptedAesKeyLength: encryptedAesKey?.length,
      nonceLength: nonce?.length,
      ephemeralPublicKeyLength: ephemeralPublicKey?.length,
      walletPrivateKeyLength: walletPrivateKey?.length,
    });
    
    // Step 1: Decrypt the AES key using the wallet's private key
    const aesKeyBytes = decryptAesKeyWithWallet(
      encryptedAesKey,
      nonce,
      ephemeralPublicKey,
      walletPrivateKey
    );
    
    // Step 2: Import the decrypted AES key
    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      aesKeyBytes,
      { name: 'AES-GCM', length: 256 },
      false, // don't allow export
      ['decrypt']
    );
    
    // Step 3: Convert hex IV to binary
    const ivBytes = hexToUint8Array(iv);
    
    // Step 4: Convert base64 encrypted data to binary
    const encryptedBytes = base64ToUint8Array(encryptedValue);
    
    console.log("Prepared data for AES decryption:", {
      ivBytesLength: ivBytes.length,
      encryptedBytesLength: encryptedBytes.length,
      aesKeyAlgorithm: aesKey.algorithm.name
    });
    
    // Step 5: Decrypt the data with AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128 // 16 bytes * 8 bits = 128 bits
      },
      aesKey,
      encryptedBytes
    );
    
    // Step 6: Convert decrypted ArrayBuffer to string
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    console.log("Decryption successful, text length:", decryptedText.length);
    
    return decryptedText;
  } catch (error) {
    console.error('Error in decryptSecretWithWallet:', error);
    throw new Error(`Failed to decrypt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Legacy decryption function for backward compatibility
 * Uses a direct AES key for decryption instead of wallet key
 */
export async function decryptWithDirectKey(
  encryptedValue: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  try {
    // Convert hex IV to bytes
    const ivBytes = hexToUint8Array(iv);
    
    // Convert base64 encrypted data to bytes
    const encryptedBytes = base64ToUint8Array(encryptedValue);
    
    console.log(' Decryption inputs:', {
      ivLength: ivBytes.length,
      encryptedLength: encryptedBytes.length,
      keyType: key.type
    });
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128 // 16 bytes authentication tag
      },
      key,
      encryptedBytes
    );
    
    // Convert the decrypted data back to string
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    
    console.log('✅ Decryption successful:', {
      decryptedLength: decryptedText.length
    });
    
    return decryptedText;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
