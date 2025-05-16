/**
 * Frontend Crypto Module
 * Handles all encryption/decryption operations using the Web Crypto API
 */

/**
 * Convert a Uint8Array to a hex string
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  if (!hex || typeof hex !== 'string') {
    console.error('❌ Invalid hex string provided:', hex);
    return new Uint8Array(0);
  }
  
  // Remove any non-hex characters
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  
  // Ensure even length
  let paddedHex = cleanHex;
  if (cleanHex.length % 2 !== 0) {
    paddedHex = '0' + cleanHex;
  }
  
  // Convert to bytes
  const bytes = new Uint8Array(paddedHex.length / 2);
  
  try {
    for (let i = 0; i < paddedHex.length; i += 2) {
      bytes[i / 2] = parseInt(paddedHex.substring(i, i + 2), 16);
    }
  } catch (error) {
    console.error('❌ Error converting hex to bytes:', error);
    throw new Error(`Hex conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return bytes;
}

/**
 * Convert a Uint8Array to a base64 string
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  const binaryString = Array.from(array)
    .map(byte => String.fromCharCode(byte))
    .join('');
  return btoa(binaryString);
}

/**
 * Convert a base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  if (!base64 || typeof base64 !== 'string') {
    console.error('❌ Invalid base64 string provided:', base64);
    return new Uint8Array(0);
  }
  
  // Clean up base64 string
  const cleanBase64 = base64.replace(/\s/g, '');
  
  // Log the input
  console.log(' Base64 decoding input:', {
    originalLength: base64.length,
    cleanedLength: cleanBase64.length,
    hasValidBase64Chars: /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64),
    paddingChars: (cleanBase64.match(/=/g) || []).length,
    needsPadding: cleanBase64.length % 4 !== 0
  });
  
  // Ensure proper padding
  let paddedBase64 = cleanBase64;
  while (paddedBase64.length % 4 !== 0) {
    paddedBase64 += '=';
  }
  
  const paddingAdded = paddedBase64 !== cleanBase64;
  if (paddingAdded) {
    console.log('✅ Added base64 padding:', {
      before: cleanBase64.length,
      after: paddedBase64.length,
      paddingAdded: paddedBase64.length - cleanBase64.length
    });
  }
  
  try {
    const binaryString = atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Log the output
    console.log('✅ Base64 decoding output:', {
      binaryStringLength: binaryString.length,
      bytesLength: bytes.length,
      firstBytesHex: Array.from(bytes.slice(0, Math.min(bytes.length, 8)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' '),
      lastBytesHex: bytes.length > 8 ? 
        Array.from(bytes.slice(Math.max(0, bytes.length - 8)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ') 
        : 'N/A'
    });
    
    return bytes;
  } catch (error) {
    console.error('❌ Base64 conversion error:', error);
    // Try to debug what part of the string might be causing issues
    try {
      // Test with a valid subset of the string
      const testSegment = paddedBase64.substring(0, 4); // Just first valid quartet
      console.log(' Testing with valid base64 segment:', {
        segment: testSegment,
        decodedLength: atob(testSegment).length
      });
    } catch (subError) {
      console.error('Even simple segment failed:', subError);
    }
    
    throw new Error(`Base64 conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * A more robust base64 to binary conversion that handles potential encoding issues
 * This is a fallback if the standard atob method fails
 */
export function robustBase64ToUint8Array(base64: string): Uint8Array {
  if (!base64 || typeof base64 !== 'string') {
    return new Uint8Array(0);
  }
  
  // Clean up and standardize the base64 string
  let cleanBase64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
  
  // Ensure proper padding
  while (cleanBase64.length % 4 !== 0) {
    cleanBase64 += '=';
  }
  
  try {
    // Try using the built-in atob first
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.warn('Built-in atob failed, using fallback decoder');
    
    // Fallback: Manual base64 decoding
    const lookup = new Uint8Array(256);
    for (let i = 0; i < 64; i++) {
      lookup['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charCodeAt(i)] = i;
    }
    
    const paddingLength = cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0;
    const outputLength = (cleanBase64.length * 3) / 4 - paddingLength;
    const result = new Uint8Array(outputLength);
    
    let position = 0;
    for (let i = 0; i < cleanBase64.length; i += 4) {
      const a = lookup[cleanBase64.charCodeAt(i)] || 0;
      const b = lookup[cleanBase64.charCodeAt(i + 1)] || 0;
      const c = lookup[cleanBase64.charCodeAt(i + 2)] || 0;
      const d = lookup[cleanBase64.charCodeAt(i + 3)] || 0;
      
      result[position++] = (a << 2) | (b >> 4);
      if (position < outputLength) result[position++] = ((b & 15) << 4) | (c >> 2);
      if (position < outputLength) result[position++] = ((c & 3) << 6) | d;
    }
    
    return result;
  }
}

/**
 * Interface for encrypted data returned by encryption operations
 */
export interface EncryptedData {
  // The encrypted value (combined ciphertext + auth tag, base64 encoded)
  encrypted: string;
  // The IV used for encryption (hex encoded)
  iv: string;
  // The auth tag for integrity verification (hex encoded)
  authTag: string;
}

/**
 * Generate a random AES key for encryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('❌ Failed to generate encryption key:', error);
    throw new Error(`Key generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Export a CryptoKey to raw bytes and convert to base64
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  try {
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    return uint8ArrayToBase64(new Uint8Array(rawKey));
  } catch (error) {
    console.error('❌ Failed to export key:', error);
    throw new Error(`Key export failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Import a base64 key back to a CryptoKey
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  try {
    const keyData = base64ToUint8Array(base64Key);
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('❌ Failed to import key:', error);
    throw new Error(`Key import failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Encrypt data with AES-GCM
 * Returns encrypted data with base64-encoded ciphertext and hex-encoded IV
 * Note: Auth tag is already appended to the ciphertext in the encryptedBuffer
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  try {
    // Generate a 12-byte IV (recommended for AES-GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Convert data to bytes
    const dataBytes = new TextEncoder().encode(data);
    
    // Show detailed info about the key
    console.log('Encryption key details:', {
      type: key.type,
      algorithm: key.algorithm.name,
      extractable: key.extractable,
      usages: key.usages
    });
    
    // Log detailed input parameters
    console.log('Encryption inputs:', {
      plaintextByteLength: dataBytes.length,
      ivByteLength: iv.length,
      ivHex: uint8ArrayToHex(iv),
      plaintextStart: data.substring(0, 20) + (data.length > 20 ? '...' : ''),
    });

    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128 // 16 bytes authentication tag
      },
      key,
      dataBytes
    );
    
    // Get detailed info about the encrypted result
    const encrypted = new Uint8Array(encryptedBuffer);
    
    // Examine the structure - the auth tag is appended to the end
    const ciphertextOnly = encrypted.slice(0, encrypted.length - 16);
    const tagBytes = encrypted.slice(encrypted.length - 16);
    
    // Convert to hex for debugging
    const ciphertextHex = uint8ArrayToHex(ciphertextOnly.slice(0, Math.min(ciphertextOnly.length, 8))) + '...';
    const authTagHex = uint8ArrayToHex(tagBytes);
    
    // Convert the encrypted data to base64
    // Note: encryptedBuffer already includes auth tag appended at the end
    const encryptedBase64 = uint8ArrayToBase64(new Uint8Array(encryptedBuffer));
    
    // Convert IV to hex
    const ivHex = uint8ArrayToHex(iv);
    
    // Verify encrypted data has correct size (plaintext + 16 bytes auth tag)
    const expectedCipherLength = dataBytes.length + 16; // plaintext + auth tag
    
    console.log(' Encryption detailed result:', {
      encryptedTotalBytes: encrypted.length,
      ciphertextBytes: ciphertextOnly.length,
      authTagBytes: tagBytes.length,
      expectedTotalBytes: expectedCipherLength,
      sizesMatch: encrypted.length === expectedCipherLength,
      encryptedBase64Length: encryptedBase64.length,
      base64Padding: encryptedBase64.length % 4 === 0 ? 'Correct' : 'Missing',
      // Preview the actual data
      ciphertextHexPreview: ciphertextHex,
      authTagHexFull: authTagHex,
      base64Preview: encryptedBase64.substring(0, 16) + '...'
    });
    
    console.log('✅ Encryption successful:', {
      dataLength: dataBytes.length,
      ivLength: iv.length,
      ivHex: ivHex.substring(0, 8) + '...',
      encryptedLength: encrypted.length,
      authTagLength: tagBytes.length,
      authTagHex: authTagHex.substring(0, 8) + '...',
      encryptedBase64Start: encryptedBase64.substring(0, 8) + '...',
      expectedCipherLength,
      sizeVerification: encrypted.length === expectedCipherLength ? '✓ Correct' : '✗ Wrong size'
    });
    
    return {
      encrypted: encryptedBase64,  // Combined ciphertext + auth tag in base64
      iv: ivHex,                   // IV in hex format
      authTag: authTagHex          // Auth tag in hex (for backward compatibility)
    };
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Decrypt data with AES-GCM
 * Expected input:
 * - encrypted: base64 string of ciphertext + auth tag
 * - iv: hex string of IV
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  try {
    // Validate inputs to prevent cryptic errors
    if (!encryptedData.encrypted) {
      throw new Error('Missing encrypted data');
    }
    
    if (!encryptedData.iv) {
      throw new Error('Missing IV');
    }
    
    // Print more details about the key
    console.log('Key details:', {
      type: key.type,
      algorithm: key.algorithm.name,
      extractable: key.extractable,
      usages: key.usages,
    });
    
    // Convert hex IV to bytes
    const ivBytes = hexToUint8Array(encryptedData.iv);
    if (ivBytes.length !== 12) {
      console.warn(`IV length is ${ivBytes.length} bytes, expected 12 bytes`);
    }
    
    // Log first few bytes of IV in hex for debugging
    const ivBytesHex = Array.from(ivBytes.slice(0, Math.min(ivBytes.length, 12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    // Try the standard conversion first
    let encryptedBytes;
    try {
      encryptedBytes = base64ToUint8Array(encryptedData.encrypted);
    } catch (conversionError) {
      console.warn('Standard base64 conversion failed, trying robust converter:', conversionError);
      encryptedBytes = robustBase64ToUint8Array(encryptedData.encrypted);
    }
    
    // Log byte length and first/last few bytes of encrypted data
    const encryptedBytesFirstHex = Array.from(encryptedBytes.slice(0, Math.min(encryptedBytes.length, 8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    const encryptedBytesLastHex = Array.from(encryptedBytes.slice(Math.max(0, encryptedBytes.length - 16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    // Check if base64 is properly padded
    const isPaddingCorrect = encryptedData.encrypted.length % 4 === 0;
    
    console.log(' Detailed decryption inputs:', {
      ivLength: ivBytes.length,
      ivHex: encryptedData.iv.substring(0, 16) + '...',
      ivBytesActual: ivBytesHex,
      encryptedBase64Length: encryptedData.encrypted.length,
      encryptedBytesLength: encryptedBytes.length,
      encryptedBase64Start: encryptedData.encrypted.substring(0, 16) + '...',
      encryptedFirstBytes: encryptedBytesFirstHex,
      encryptedLastBytes: encryptedBytesLastHex, // Should contain the auth tag
      base64PaddingCorrect: isPaddingCorrect,
      keyType: key.type
    });
    
    // Ensure base64 padding is correct
    let paddedEncrypted = encryptedData.encrypted;
    while (paddedEncrypted.length % 4 !== 0) {
      paddedEncrypted += '=';
    }
    
    // Check if padding was added
    const paddingAdded = paddedEncrypted !== encryptedData.encrypted;
    if (paddingAdded) {
      console.log('✅ Added base64 padding:', {
        originalLength: encryptedData.encrypted.length,
        paddedLength: paddedEncrypted.length,
        paddingAdded: paddedEncrypted.length - encryptedData.encrypted.length
      });
    }
    
    // Re-decode with proper padding if needed
    const finalEncryptedBytes = paddingAdded ? 
      base64ToUint8Array(paddedEncrypted) : 
      encryptedBytes;
    
    // Compare lengths before and after padding
    if (paddingAdded) {
      console.log('Re-decoded bytes after padding:', {
        originalLength: encryptedBytes.length,
        afterPaddingLength: finalEncryptedBytes.length,
        difference: finalEncryptedBytes.length - encryptedBytes.length
      });
    }

    // Check if this looks like it might contain an auth tag
    const hasProperLength = finalEncryptedBytes.length >= 16;
    const authTagBytes = hasProperLength ? finalEncryptedBytes.slice(finalEncryptedBytes.length - 16) : new Uint8Array(0);
    const authTagBytesHex = Array.from(authTagBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    console.log('Auth tag check:', {
      hasProperLength,
      encryptedTotalLength: finalEncryptedBytes.length,
      expectedAuthTagLength: 16,
      extractedAuthTagBytes: authTagBytesHex
    });
    
    // Verify the encrypted data structure looks valid before attempting decryption
    if (finalEncryptedBytes.length < 16) {
      console.error('❌ Encrypted data too short to contain auth tag');
      throw new Error('Encrypted data too short - missing auth tag');
    }
    
    // Decrypt the data
    console.log('🔄 Attempting decryption with:', {
      ivLength: ivBytes.length,
      encryptedLength: finalEncryptedBytes.length,
      algorithm: 'AES-GCM',
      tagLength: 128
    });
    
    try {
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
          iv: ivBytes,
          tagLength: 128 // 16 bytes authentication tag
        },
        key,
        finalEncryptedBytes
      );
      
      // Convert the decrypted data back to string
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      
      console.log('✅ Decryption successful:', {
        decryptedByteLength: decryptedBuffer.byteLength,
        decryptedTextLength: decryptedText.length,
        decryptedTextPreview: decryptedText.substring(0, 20) + (decryptedText.length > 20 ? '...' : '')
      });
      
      return decryptedText;
    } catch (decryptError) {
      console.error('❌ WebCrypto decrypt operation failed:', decryptError);
      
      // Try again with a different approach - separate auth tag
      if (finalEncryptedBytes.length >= 32) {
        console.log('Trying alternative decryption approach - separate ciphertext and auth tag');
        
        try {
          // Extract ciphertext and auth tag separately
          const ciphertextLength = finalEncryptedBytes.length - 16;
          const ciphertext = finalEncryptedBytes.slice(0, ciphertextLength);
          const authTag = finalEncryptedBytes.slice(ciphertextLength);
          
          console.log('Split approach details:', {
            originalLength: finalEncryptedBytes.length,
            ciphertextLength,
            authTagLength: authTag.length,
            authTagHex: Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join(' ')
          });
          
          // Recreate the full encrypted data structure as expected by WebCrypto
          // This shouldn't be necessary but might help diagnose issues
          const fullData = new Uint8Array(ciphertext.length + authTag.length);
          fullData.set(ciphertext);
          fullData.set(authTag, ciphertext.length);
          
          throw new Error('Alternative approach also failed');
        } catch (alternativeError) {
          console.error('❌ Alternative decryption approach also failed:', alternativeError);
          throw decryptError; // Throw the original error
        }
      }
      
      throw decryptError;
    }
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if WebCrypto is fully supported in this browser
 */
export async function checkWebCryptoSupport(): Promise<boolean> {
  if (!window.crypto || !window.crypto.subtle) {
    return false;
  }
  
  try {
    // Test key generation
    const testKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Test encryption
    const testData = new TextEncoder().encode('WebCrypto test');
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      testKey,
      testData
    );
    
    // Test decryption
    await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      testKey,
      encrypted
    );
    
    return true;
  } catch (error) {
    console.error('WebCrypto support test failed:', error);
    return false;
  }
}
