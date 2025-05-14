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
 * Convert a hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  try {
    // Remove any non-hex characters (like spaces or 0x prefix)
    const cleanHex = hex.replace(/[^0-9a-f]/gi, '');
    
    // Make sure we have a valid hex string (even length)
    const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
    
    // Convert to byte array
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
function base64ToUint8Array(base64: string): Uint8Array {
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
 * 
 * @param encryptedValue - Base64 encoded encrypted value from backend (now includes authTag)
 * @param iv - Hex string IV from backend
 * @param authTag - Hex string authentication tag from backend (may not be needed with new format)
 * @returns The decrypted plaintext
 */
export async function decryptSecret(
  encryptedValue: string,
  iv: string,
  authTag: string
): Promise<string> {
  try {
    // Debug logging
    console.log("Decryption attempt with:", {
      encryptedValueLength: encryptedValue?.length, 
      ivLength: iv?.length,
      authTagLength: authTag?.length
    });
    
    // Check for encryption key in localStorage
    const encryptionKey = localStorage.getItem('solkey:encryption-key');
    if (!encryptionKey) {
      const availableKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('solkey'))
        .join(', ');
      console.error("Encryption key not found in localStorage. Available keys:", availableKeys);
      throw new Error("Encryption key not available. Please authenticate with your wallet first.");
    }
    
    // Get the encryption key bytes from localStorage (base64 encoded)
    const keyBytes = base64ToUint8Array(encryptionKey);
    console.log("Encryption key bytes length:", keyBytes.length);
    
    // Create a CryptoKey from the raw bytes
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false, // don't allow export
      ['decrypt']
    );
    
    // Convert hex IV to binary
    const ivBytes = hexToUint8Array(iv);
    console.log("IV details:", {
      originalHexLength: iv.length,
      decodedByteLength: ivBytes.length,
      expectedLength: 12, // Now expecting 12-byte IV from backend
      firstBytes: Array.from(ivBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')
    });
    
    // Backend now uses 12-byte IV for better WebCrypto compatibility
    if (ivBytes.length !== 12 && ivBytes.length !== 16) {
      console.error(`Invalid IV length: ${ivBytes.length} bytes, expected 12 or 16 bytes`);
      throw new Error("Invalid IV format or length, must be 12 or 16 bytes");
    }
    
    // Convert base64 encrypted data to binary
    let encryptedBytes: Uint8Array;
    try {
      // The encrypted value now already contains the authentication tag appended
      encryptedBytes = base64ToUint8Array(encryptedValue);
      if (encryptedBytes.length === 0) {
        throw new Error("Empty encrypted data");
      }
    } catch (e) {
      console.error("Failed to decode encrypted data:", e);
      throw new Error("Invalid encrypted data format. Expected base64-encoded data.");
    }
    
    console.log("Data prepared for decryption:", {
      ivBytesLength: ivBytes.length,
      encryptedBytesLength: encryptedBytes.length
    });
    
    // Attempt decryption with WebCrypto (the encrypted data already includes the auth tag)
    try {
      console.log("Decryption attempt #1: Using direct encrypted data with WebCrypto");
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
          tagLength: 128 // 16 bytes * 8 bits = 128 bits
        },
        key,
        encryptedBytes
      );
      
      // Convert decrypted ArrayBuffer to string
      const decryptedText = new TextDecoder().decode(decrypted);
      console.log("Decryption successful, text length:", decryptedText.length);
      return decryptedText;
    } catch (error) {
      console.error("Primary decryption failed:", error);
      
      // Fallback approach #1: Try with auth tag separated
      console.log("Attempting fallback decryption approach #1: Separating ciphertext and auth tag");
      
      try {
        // In AES-GCM, auth tag is typically 16 bytes and is at the end
        const authTagLength = 16;
        const ciphertextLength = encryptedBytes.length - authTagLength;
        
        if (ciphertextLength <= 0) {
          throw new Error("Encrypted data too short to extract auth tag");
        }
        
        const ciphertext = encryptedBytes.slice(0, ciphertextLength);
        const extractedTag = encryptedBytes.slice(ciphertextLength);
        
        console.log("Split data details:", {
          totalLength: encryptedBytes.length,
          ciphertextLength,
          extractedTagLength: extractedTag.length,
          extractedTagFirstBytes: Array.from(extractedTag.slice(0, 4))
            .map(b => b.toString(16).padStart(2, '0')).join('')
        });
        
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBytes,
            tagLength: 128
          },
          key,
          encryptedBytes // Still using the full data
        );
        
        const decryptedText = new TextDecoder().decode(decrypted);
        console.log("Fallback approach #1 succeeded, text length:", decryptedText.length);
        return decryptedText;
      } catch (fallback1Error) {
        console.error("Fallback approach #1 failed:", fallback1Error);
      }
      
      // Fallback #2: Try with the separate auth tag provided by backend
      console.log("Attempting fallback approach #2: Using separate auth tag from backend");
      
      try {
        const authTagBytes = hexToUint8Array(authTag);
        if (authTagBytes.length === 0) {
          throw new Error("Invalid auth tag for fallback");
        }
        
        console.log("Auth tag details:", {
          originalHexLength: authTag.length,
          decodedByteLength: authTagBytes.length,
          firstBytes: Array.from(authTagBytes.slice(0, 4))
            .map(b => b.toString(16).padStart(2, '0')).join('')
        });
        
        // This is the old way, combining them manually
        const combinedData = new Uint8Array(encryptedBytes.length + authTagBytes.length);
        combinedData.set(encryptedBytes);
        combinedData.set(authTagBytes, encryptedBytes.length);
        
        console.log("Combined data details:", {
          encryptedBytesLength: encryptedBytes.length,
          authTagBytesLength: authTagBytes.length,
          combinedLength: combinedData.length
        });
        
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBytes,
            tagLength: 128
          },
          key,
          combinedData
        );
        
        const decryptedText = new TextDecoder().decode(decrypted);
        console.log("Fallback approach #2 succeeded, text length:", decryptedText.length);
        return decryptedText;
      } catch (fallback2Error) {
        console.error("Fallback approach #2 failed:", fallback2Error);
        
        // Fallback #3: Try with 12-byte IV if we're using 16-byte
        if (ivBytes.length === 16) {
          console.log("Attempting fallback approach #3: Using first 12 bytes of 16-byte IV");
          try {
            const iv12Bytes = ivBytes.slice(0, 12);
            
            console.log("12-byte IV:", Array.from(iv12Bytes)
              .map(b => b.toString(16).padStart(2, '0')).join(''));
              
            const decrypted = await crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: iv12Bytes,
                tagLength: 128
              },
              key,
              encryptedBytes
            );
            
            const decryptedText = new TextDecoder().decode(decrypted);
            console.log("Fallback approach #3 succeeded, text length:", decryptedText.length);
            return decryptedText;
          } catch (fallback3Error) {
            console.error("Fallback approach #3 failed:", fallback3Error);
          }
        }
        
        // If all fallbacks failed, throw a detailed error
        throw new Error("All decryption approaches failed. Your browser may not support WebCrypto properly or the data format is incompatible.");
      }
    }
  } catch (error) {
    console.error('Error in decryptSecret:', error);
    throw new Error(`Failed to decrypt: ${error instanceof Error ? error.message : String(error)}`);
  }
}
