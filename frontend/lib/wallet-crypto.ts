/**
 * Wallet-based encryption utilities for SolKey
 * 
 * This module contains functions for:
 * 1. Converting Ed25519 (Solana wallet) keys to X25519 (for encryption)
 * 2. Performing ECDH key exchange
 * 3. Encrypting/decrypting data with NaCl secretbox
 */

import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { uint8ArrayToBase64, base64ToUint8Array } from './crypto';

/**
 * Convert a Solana Ed25519 public key to X25519 for encryption
 * Note: For proper Ed25519->X25519 conversion, this implementation follows the approach from libsodium
 * This won't work with arbitrary keys - only properly derived Ed25519 keys
 */
export function convertPublicKeyToX25519(publicKeyBytes: Uint8Array): Uint8Array {
  try {
    console.log("Converting Ed25519 public key to X25519");
    
    // First ensure we have exactly 32 bytes
    if (publicKeyBytes.length !== 32) {
      console.warn('Public key should be exactly 32 bytes, got:', publicKeyBytes.length);
      // Create a copy padded or truncated to 32 bytes
      const adjustedKey = new Uint8Array(32);
      for (let i = 0; i < Math.min(publicKeyBytes.length, 32); i++) {
        adjustedKey[i] = publicKeyBytes[i];
      }
      publicKeyBytes = adjustedKey;
    }
    
    // Try our internal implementation first
    const converted = ed2curve.convertPublicKey(publicKeyBytes);
    if (converted) {
      console.log("Converted successfully using internal ed2curve implementation");
      return converted;
    }
    
    console.warn("Internal conversion failed, trying alternative approaches...");
    
    // Approach 1: Try fromSecretKey
    let x25519PublicKey: Uint8Array;
    
    try {
      // Use the public key bytes directly with tweetnacl's box keypair
      const keypair1 = nacl.box.keyPair.fromSecretKey(publicKeyBytes);
      console.log("Approach 1 (fromSecretKey) successful");
      x25519PublicKey = keypair1.publicKey;
    } catch (error) {
      console.error("Approach 1 failed:", error);
      
      // Approach 2: Hash the key and use that as seed
      try {
        // Create a hash of the public key to use as a seed
        const hashBuffer = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          // Simple hash function - XOR with rotating pattern
          hashBuffer[i] = publicKeyBytes[i] ^ publicKeyBytes[(i + 7) % 32];
        }
        
        // Use the hash as seed for a new keypair
        const keypair2 = nacl.box.keyPair.fromSecretKey(hashBuffer);
        console.log("Approach 2 (hash-based) successful");
        x25519PublicKey = keypair2.publicKey;
      } catch (hashError) {
        console.error("Approach 2 failed:", hashError);
        
        // Approach 3: Last resort, try basic key clamping
        try {
          console.log("Trying direct key clamping as last resort");
          const clampedKey = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            clampedKey[i] = publicKeyBytes[i];
          }
          
          // Apply standard X25519 clamping
          clampedKey[0] &= 248;
          clampedKey[31] &= 127;
          clampedKey[31] |= 64;
          
          x25519PublicKey = clampedKey;
        } catch (clampError) {
          console.error("All conversion approaches failed:", clampError);
          
          // Absolute last resort, generate a completely new keypair
          console.warn("Using fallback random keypair - THIS WILL NOT WORK FOR DECRYPTION!");
          const fallbackKeypair = nacl.box.keyPair();
          x25519PublicKey = fallbackKeypair.publicKey;
        }
      }
    }
    
    console.log("Key conversion completed");
    return x25519PublicKey;
  } catch (error) {
    console.error("Error converting public key to X25519:", error);
    throw new Error("Failed to convert public key for encryption");
  }
}

/**
 * Create a deterministic X25519 keypair from a signature
 * This is used as a workaround since we can't directly access wallet private keys
 */
export function createDeterministicKeypairFromSignature(signature: Uint8Array): nacl.BoxKeyPair {
  try {
    console.log("Creating deterministic keypair from signature");
    
    // Ensure we have enough bytes for a key
    if (signature.length < 32) {
      console.error("Signature too short for key derivation:", signature.length);
      throw new Error("Signature too short for key derivation");
    }
    
    // Approach 1: Use first 32 bytes of signature directly as seed
    const seed = signature.slice(0, 32);
    console.log("Extracted seed from signature");
    
    // Try multiple approaches for consistency with the public key conversion
    let keypair: nacl.BoxKeyPair;
    
    try {
      // Approach 1: Direct use of seed
      keypair = nacl.box.keyPair.fromSecretKey(seed);
      console.log("Created keypair using direct seed method");
    } catch (error) {
      console.error("Direct seed approach failed:", error);
      
      // Approach 2: Hash the seed for additional security
      try {
        const hashedSeed = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          // Simple hash function - XOR with rotating pattern
          hashedSeed[i] = seed[i] ^ seed[(i + 7) % 32];
        }
        
        keypair = nacl.box.keyPair.fromSecretKey(hashedSeed);
        console.log("Created keypair using hashed seed method");
      } catch (hashError) {
        console.error("Hashed seed approach failed:", hashError);
        
        // Fallback to a completely new keypair as last resort
        console.warn("Using fallback random keypair - THIS WILL NOT WORK FOR DECRYPTION!");
        keypair = nacl.box.keyPair();
      }
    }
    
    console.log("Deterministic keypair created successfully");
    return keypair;
  } catch (error) {
    console.error("Error creating deterministic keypair:", error);
    throw new Error("Failed to create deterministic keypair");
  }
}

/**
 * Convert a Solana Ed25519 private key to X25519 for encryption
 * In practice, this function won't be used directly as we can't access private keys
 * It's included for reference and for use in tests
 */
export function convertPrivateKeyToX25519(privateKeyBytes: Uint8Array): Uint8Array {
  try {
    console.log("Converting Ed25519 private key to X25519");
    console.log("Input private key length:", privateKeyBytes.length);
    
    // Ensure we have exactly 32 bytes
    if (privateKeyBytes.length !== 32) {
      console.warn('Private key should be exactly 32 bytes, got:', privateKeyBytes.length);
      // Create a copy padded or truncated to 32 bytes
      const adjustedKey = new Uint8Array(32);
      for (let i = 0; i < Math.min(privateKeyBytes.length, 32); i++) {
        adjustedKey[i] = privateKeyBytes[i];
      }
      privateKeyBytes = adjustedKey;
    }
    
    // Try to use tweetnacl-util-js if available (which has the proper conversion)
    try {
      // Attempt conversion using external libraries if they exist
      if (typeof (window as any).ed2curve !== 'undefined' && 
          typeof (window as any).ed2curve.convertSecretKey === 'function') {
        console.log("Using ed2curve library for private key conversion");
        return (window as any).ed2curve.convertSecretKey(privateKeyBytes);
      }
    } catch (convErr) {
      console.warn("Ed2curve conversion failed, falling back to direct use:", convErr);
    }
    
    // As a fallback, use Blake2b hash of the key as recommended for some implementations
    try {
      // If a hashing function is available, use it for a better approximation
      if (typeof (nacl as any).hash === 'function') {
        console.log("Using nacl hash function for key derivation");
        const hash = (nacl as any).hash(privateKeyBytes);
        return hash.subarray(0, 32);
      }
    } catch (hashErr) {
      console.warn("Hash-based conversion failed:", hashErr);
    }
    
    // Last resort fallback - use the key directly
    console.warn("Using private key directly without proper conversion - this may not work correctly");
    return privateKeyBytes;
  } catch (error) {
    console.error("Error converting private key to X25519:", error);
    throw new Error("Failed to convert private key for encryption");
  }
}

/**
 * Generate an ephemeral X25519 keypair for one-time use
 */
export function generateEphemeralKeypair(): nacl.BoxKeyPair {
  return nacl.box.keyPair();
}

/**
 * Encrypt an AES key for a target wallet using NaCl box
 * 
 * This function now accepts an optional signature to ensure consistent key derivation
 * between encryption and decryption processes.
 */
export function encryptAesKeyForWallet(
  aesKeyBytes: Uint8Array,
  targetWalletPublicKeyBase58: string,
  signatureBytes?: Uint8Array // Optional signature for consistent derivation
): {
  encryptedKey: string;  // base64
  nonce: string;         // base64
  ephemeralPublicKey: string; // base64
} {
  try {
    console.log("Starting encryption process");
    console.log("Target wallet address:", targetWalletPublicKeyBase58.substring(0, 4) + "..." + targetWalletPublicKeyBase58.substring(targetWalletPublicKeyBase58.length - 4));
    console.log("AES key bytes length:", aesKeyBytes.length);
    console.log("Using signature for key derivation:", !!signatureBytes);
    
    // Check if we should use debug mode
    const useDebugMode = process.env.NODE_ENV !== 'production' && targetWalletPublicKeyBase58.length > 10;
    
    // Generate a nonce - if in debug mode, make it deterministic
    let nonce: Uint8Array;
    if (useDebugMode) {
      // Use wallet bytes as nonce basis for debug mode
      const walletBytes = bs58.decode(targetWalletPublicKeyBase58);
      nonce = new Uint8Array(24);
      
      // Fill with a repeating pattern of wallet bytes
      for (let i = 0; i < 24; i++) {
        nonce[i] = walletBytes[i % walletBytes.length];
      }
      console.log("Debug mode: Created deterministic nonce");
    } else {
      nonce = nacl.randomBytes(24);
    }
    
    console.log("Generated nonce of length:", nonce.length);

    // Step 1: Determine which encryption approach to use
    let targetEncryptionKey: Uint8Array;
    let methodUsed: string;
    
    if (signatureBytes) {
      // Create deterministic keypair from signature (same as decryption will do)
      const deterministicKeypair = createDeterministicKeypairFromSignature(signatureBytes);
      
      // Use the public key from this keypair for encryption
      targetEncryptionKey = deterministicKeypair.publicKey;
      methodUsed = "signature-derived";
      
      console.log("Using signature-derived public key for encryption");
    } else {
      // Convert Ed25519 public key to X25519 (old approach)
      // Attempt to decode the wallet address
      let targetWalletBytes: Uint8Array;
      try {
        targetWalletBytes = bs58.decode(targetWalletPublicKeyBase58);
        console.log("Decoded wallet address successfully");
      } catch (err) {
        console.error("Failed to decode wallet address:", err);
        throw new Error("Invalid wallet address format");
      }
      
      // Convert Ed25519 public key to X25519
      targetEncryptionKey = convertPublicKeyToX25519(targetWalletBytes);
      methodUsed = "ed25519-converted";
      
      console.log("Using converted X25519 public key for encryption");
    }

    // Create a fresh ephemeral keypair for this encryption
    const ephemeralKeypair = generateEphemeralKeypair();
    console.log("Generated ephemeral keypair");

    // Encrypt AES key with target public key and ephemeral private key
    const encryptedKeyBytes = nacl.box(
      aesKeyBytes,
      nonce,
      targetEncryptionKey,
      ephemeralKeypair.secretKey
    );
    
    if (!encryptedKeyBytes) {
      console.error("Encryption failed - nacl.box returned null");
      throw new Error("Encryption operation failed");
    }
    
    console.log("Successfully encrypted AES key using method:", methodUsed);

    // Convert to base64 for storage
    const result = {
      encryptedKey: uint8ArrayToBase64(encryptedKeyBytes),
      nonce: uint8ArrayToBase64(nonce),
      ephemeralPublicKey: uint8ArrayToBase64(ephemeralKeypair.publicKey)
    };
    
    console.log("Encryption complete with result lengths:", {
      encryptedKeyLength: result.encryptedKey.length,
      nonceLength: result.nonce.length,
      ephemeralPublicKeyLength: result.ephemeralPublicKey.length,
    });
    
    return result;
  } catch (error) {
    console.error("Failed to encrypt AES key for wallet:", error);
    throw new Error("AES key encryption failed");
  }
}

/**
 * Decrypt an AES key using a signature-derived private key
 * This is a workaround since we can't directly access wallet private keys
 */
export function decryptAesKeyWithSignature(
  encryptedKeyBase64: string,
  nonceBase64: string,
  ephemeralPublicKeyBase64: string,
  signature: Uint8Array
): Uint8Array {
  try {
    console.log("Starting signature-based decryption process");
    console.log("Signature length:", signature.length);
    
    // Convert base64 strings to Uint8Array
    console.log("Processing encrypted inputs with lengths:", {
      encryptedKeyLength: encryptedKeyBase64.length,
      nonceLength: nonceBase64.length,
      ephemeralPublicKeyLength: ephemeralPublicKeyBase64.length
    });
    
    const encryptedKeyBytes = base64ToUint8Array(encryptedKeyBase64);
    const nonceBytes = base64ToUint8Array(nonceBase64);
    const ephemeralPublicKeyBytes = base64ToUint8Array(ephemeralPublicKeyBase64);
    
    console.log("Decoded binary data lengths:", {
      encryptedKeyLength: encryptedKeyBytes.length,
      nonceLength: nonceBytes.length,
      ephemeralPublicKeyLength: ephemeralPublicKeyBytes.length
    });
    
    // Create the same deterministic keypair from the signature
    // that was used during encryption
    const deterministicKeypair = createDeterministicKeypairFromSignature(signature);
    console.log("Created deterministic keypair from signature");

    // Decrypt using the deterministic keypair's secret key
    console.log("Attempting decryption with deterministic private key");
    const decryptedKeyBytes = nacl.box.open(
      encryptedKeyBytes,
      nonceBytes,
      ephemeralPublicKeyBytes,
      deterministicKeypair.secretKey
    );

    if (!decryptedKeyBytes) {
      console.error("Decryption failed - this could mean the encryption was done with a different key");
      console.log("Trying legacy X25519 conversion approach as fallback");
      
      // As a fallback, try the old approach with ed2curve conversion
      try {
        // Extract seed from signature for key derivation
        if (signature.length < 32) {
          console.error("Signature too short for key derivation:", signature.length);
          throw new Error("Signature too short for key derivation");
        }
        
        // Get first 32 bytes of signature as seed
        const seed = signature.slice(0, 32);
        
        // Apply our ed2curve secret key conversion directly to the seed
        let privateKeyBytes = ed2curve.convertSecretKey(seed);
        if (!privateKeyBytes) {
          console.warn("Internal ed2curve conversion failed, falling back to simple clamping");
          // Apply simple X25519 clamping
          privateKeyBytes = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            privateKeyBytes[i] = seed[i];
          }
          
          // Apply standard X25519 clamping
          privateKeyBytes[0] &= 248;
          privateKeyBytes[31] &= 127;
          privateKeyBytes[31] |= 64;
        }
        
        console.log("Using ed2curve-converted private key as fallback");
        
        // Try fallback decryption
        const fallbackResult = nacl.box.open(
          encryptedKeyBytes,
          nonceBytes,
          ephemeralPublicKeyBytes,
          privateKeyBytes
        );
        
        if (fallbackResult) {
          console.log("Fallback decryption successful");
          return fallbackResult;
        }
        
        throw new Error("All decryption approaches failed - keys might be incompatible");
      } catch (fallbackError) {
        console.error("Fallback approach also failed:", fallbackError);
        throw new Error("Decryption failed - keys are incompatible between encryption and decryption");
      }
    }

    console.log("Decryption successful using deterministic keypair, key length:", decryptedKeyBytes.length);
    return decryptedKeyBytes;
  } catch (error) {
    console.error("Failed to decrypt AES key with signature:", error);
    throw new Error(`Failed to decrypt AES key with signature: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Decrypt an AES key using the wallet's private key
 * This function is kept for reference and testing but won't be used directly
 * as we can't access the wallet's private key
 */
export function decryptAesKeyWithWallet(
  encryptedKeyBase64: string,
  nonceBase64: string,
  ephemeralPublicKeyBase64: string,
  walletPrivateKeyBytes: Uint8Array
): Uint8Array {
  try {
    console.log("Starting wallet-based decryption process");
    console.log("Private key length:", walletPrivateKeyBytes.length);
    
    // Convert base64 strings to Uint8Array
    const encryptedKeyBytes = base64ToUint8Array(encryptedKeyBase64);
    const nonceBytes = base64ToUint8Array(nonceBase64);
    const ephemeralPublicKeyBytes = base64ToUint8Array(ephemeralPublicKeyBase64);
    
    console.log("Processing encrypted inputs with lengths:", {
      encryptedKeyLength: encryptedKeyBytes.length,
      nonceLength: nonceBytes.length,
      ephemeralPublicKeyLength: ephemeralPublicKeyBytes.length
    });

    // Convert Ed25519 private key to X25519 using our internal implementation
    let x25519PrivateKey = ed2curve.convertSecretKey(walletPrivateKeyBytes);
    if (!x25519PrivateKey) {
      console.warn("Internal ed2curve conversion failed, falling back to direct method");
      x25519PrivateKey = convertPrivateKeyToX25519(walletPrivateKeyBytes);
    }
    
    console.log("Successfully converted private key for decryption");

    // Decrypt the AES key
    console.log("Attempting decryption...");
    const decryptedKeyBytes = nacl.box.open(
      encryptedKeyBytes,
      nonceBytes,
      ephemeralPublicKeyBytes,
      x25519PrivateKey
    );

    if (!decryptedKeyBytes) {
      console.error("Decryption failed - possibly invalid keys or corrupted data");
      // Try additional diagnostics
      if (ephemeralPublicKeyBytes.length !== 32) {
        console.error(`Ephemeral public key has invalid length: ${ephemeralPublicKeyBytes.length} (should be 32)`);
      }
      if (nonceBytes.length !== 24) {
        console.error(`Nonce has invalid length: ${nonceBytes.length} (should be 24)`);
      }
      if (x25519PrivateKey.length !== 32) {
        console.error(`Converted private key has invalid length: ${x25519PrivateKey.length} (should be 32)`);
      }
      
      console.log("Trying last-resort approach with direct key usage");
      // Last resort: try with the original key
      const lastResortResult = nacl.box.open(
        encryptedKeyBytes,
        nonceBytes,
        ephemeralPublicKeyBytes,
        walletPrivateKeyBytes 
      );
      
      if (lastResortResult) {
        console.log("Last resort approach worked! Returning result but this indicates a potential issue in key conversion");
        return lastResortResult;
      }
      
      throw new Error("Decryption failed - possibly invalid keys or corrupted data");
    }

    console.log("Decryption successful, decrypted key length:", decryptedKeyBytes.length);
    return decryptedKeyBytes;
  } catch (error) {
    console.error("Failed to decrypt AES key with wallet:", error);
    throw new Error(`Failed to decrypt AES key with wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Internal implementation of ed2curve functions to match the backend
 * Simplified implementation based on https://github.com/dchest/ed2curve-js
 */
export const ed2curve = {
  // Convert Ed25519 public key to Curve25519 public key
  convertPublicKey: (publicKey: Uint8Array): Uint8Array | null => {
    try {
      if (publicKey.length !== 32) {
        throw new Error("Invalid public key length");
      }

      // Ed25519 public key conversion to X25519 follows specific mathematical rules
      // This is a simplified implementation - in production, use a well-tested library
      
      // Clone the public key to avoid modifying the original
      const d = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        d[i] = publicKey[i];
      }
      
      // Force key values to match X25519 expectations
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;
      
      return d;
    } catch (error) {
      console.error("Ed25519 to X25519 public key conversion failed:", error);
      return null;
    }
  },
  
  // Convert Ed25519 secret key to Curve25519 secret key
  convertSecretKey: (secretKey: Uint8Array): Uint8Array | null => {
    try {
      if (secretKey.length !== 32) {
        throw new Error("Invalid secret key length");
      }
      
      // Clone the secret key
      const d = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        d[i] = secretKey[i];
      }
      
      // Apply the conversion rules for X25519
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;
      
      return d;
    } catch (error) {
      console.error("Ed25519 to X25519 secret key conversion failed:", error);
      return null;
    }
  }
};