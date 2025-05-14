// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = {
  secrets: {
    // Fetch secret metadata without requiring signature (for immediate display upon wallet connection)
    listMetadata: async (walletAddress: string) => {
      try {
        console.log(`Fetching secrets metadata for wallet ${walletAddress}`);
        
        const response = await fetch(
          `${API_BASE_URL}/api/secrets/metadata?walletAddress=${walletAddress}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to fetch secrets metadata:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching secrets metadata:', error);
        throw error instanceof Error 
          ? new Error(`Failed to fetch secrets metadata: ${error.message}`)
          : new Error('Failed to fetch secrets metadata');
      }
    },
    
    list: async (data: { walletAddress: string; signature: string }) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/secrets?walletAddress=${data.walletAddress}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to fetch secrets list:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error in list secrets:', error);
        throw error instanceof Error 
          ? new Error(`Failed to fetch secrets: ${error.message}`)
          : new Error('Failed to fetch secrets');
      }
    },
    
    // Debug function to directly test the API endpoint
    debugFetchRaw: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      console.log(`DEBUG - Testing API endpoint for secret ${secretId}`, {
        url: `${API_BASE_URL}/api/secrets/${secretId}/decrypt`,
        walletAddress: data.walletAddress,
        signatureLength: data.signature?.length || 0
      });
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/secrets/${secretId}/decrypt`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          }
        );
        
        // Get raw response text first
        const responseText = await response.text();
        console.log(`DEBUG - Raw API response (${response.status})`, responseText.substring(0, 500));
        
        // Try to parse as JSON if applicable
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { error: 'Invalid JSON response', rawResponse: responseText.substring(0, 200) };
        }
        
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: responseData
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    
    fetchEncrypted: async (secretId: string, data: { walletAddress: string; signature?: string }) => {
      try {
        console.log(`Fetching encrypted data for secret ${secretId}`, { 
          walletAddress: data.walletAddress,
          url: `${API_BASE_URL}/api/secrets/${secretId}/fetchEncrypted`
        });
        
        // Verify input data before making request
        if (!secretId) {
          console.error('Missing secretId for fetchEncrypted');
          throw new Error('Secret ID is required');
        }
        
        if (!data.walletAddress) {
          console.error('Missing walletAddress for fetchEncrypted');
          throw new Error('Wallet address is required');
        }
        
        // Signature is no longer required for fetching encrypted data
        
        // Only send wallet address for fetchEncrypted - no signature required
        const response = await fetch(
          `${API_BASE_URL}/api/secrets/${secretId}/fetchEncrypted`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: data.walletAddress })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText || 'Unknown error' };
          }
          
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to fetch encrypted secret data:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            responseText: errorText.substring(0, 200) // Limit to first 200 chars
          });
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        
        // Validate response data - updated to match new backend response format
        if (!responseData || !responseData.secret || !responseData.aesKeyInfo) {
          console.error('Invalid response format:', { 
            hasData: !!responseData,
            hasSecret: !!responseData?.secret,
            hasKeyInfo: !!responseData?.aesKeyInfo
          });
          throw new Error('Server returned incomplete encryption data');
        }
        
        if (!responseData.secret.encrypted_value || !responseData.secret.iv || !responseData.secret.auth_tag) {
          console.error('Invalid secret data format:', { 
            hasEncryptedValue: !!responseData.secret?.encrypted_value,
            hasIV: !!responseData.secret?.iv,
            hasAuthTag: !!responseData.secret?.auth_tag
          });
          throw new Error('Server returned incomplete encryption data');
        }
        
        if (!responseData.aesKeyInfo.encrypted_aes_key || !responseData.aesKeyInfo.nonce || !responseData.aesKeyInfo.ephemeral_public_key) {
          console.error('Invalid key info format:', { 
            hasEncryptedAesKey: !!responseData.aesKeyInfo?.encrypted_aes_key,
            hasNonce: !!responseData.aesKeyInfo?.nonce,
            hasEphemeralPublicKey: !!responseData.aesKeyInfo?.ephemeral_public_key
          });
          throw new Error('Server returned incomplete encryption data');
        }
        
        // Simplify the data structure for the frontend
        const result = {
          // Secret info
          id: responseData.secret.id,
          name: responseData.secret.name,
          type: responseData.secret.type,
          
          // Secret encrypted data
          encrypted_value: responseData.secret.encrypted_value,
          iv: responseData.secret.iv,
          auth_tag: responseData.secret.auth_tag,
          
          // Key info
          encrypted_aes_key: responseData.aesKeyInfo.encrypted_aes_key,
          nonce: responseData.aesKeyInfo.nonce,
          ephemeral_public_key: responseData.aesKeyInfo.ephemeral_public_key
        };
        
        console.log('Successfully fetched encrypted data');
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in fetchEncrypted:', {
          secretId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw new Error(`Failed to fetch encrypted secret: ${errorMessage}`);
      }
    },
    
    decrypt: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      try {
        console.log(`Decrypting secret ${secretId} for wallet ${data.walletAddress}`);
        
        // First check if we have the encryption key available - use the correct storage key
        const encryptionKey = localStorage.getItem('solkey:encryption-key');
        if (!encryptionKey) {
          console.error('Encryption key not available - check wallet authentication');
          throw new Error('Encryption key not available. Please sign with your wallet first.');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/decrypt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to decrypt secret:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        
        // Validate the response data
        if (!responseData.encrypted_value || !responseData.iv || !responseData.auth_tag) {
          console.error('Invalid response data structure:', responseData);
          throw new Error('Server returned incomplete data');
        }
        
        // Process the response - this is the full encrypted data from backend
        const encryptedData = {
          encrypted_value: responseData.encrypted_value,
          iv: responseData.iv,
          auth_tag: responseData.auth_tag,
          name: responseData.name,
          type: responseData.type
        };
        
        // Decrypt the value client-side with our wallet-derived encryption key
        try {
          const decryptedValue = await decryptSecretWithWallet(
            encryptedData.encrypted_value,
            encryptedData.iv,
            encryptedData.auth_tag
          );
          
          // Return the decrypted data
          return {
            id: secretId,
            name: encryptedData.name,
            type: encryptedData.type,
            value: decryptedValue
          };
        } catch (decryptError) {
          console.error('Client-side decryption failed:', decryptError);
          throw new Error(`Decryption failed: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error in decrypt:', error);
        throw error instanceof Error 
          ? error  // Pass through error with original message
          : new Error('Failed to decrypt secret');
      }
    },
    
    // New diagnostic function to test the encryption system
    runDiagnostic: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      try {
        console.log(`Running encryption diagnostic for secret ${secretId}`, {
          walletAddress: data.walletAddress,
          signatureLength: data.signature?.length || 0
        });
        
        const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/diagnostic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Diagnostic failed:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error in diagnostic:', error);
        throw error instanceof Error 
          ? new Error(`Diagnostic failed: ${error.message}`)
          : new Error('Diagnostic failed');
      }
    }
  },
};

export async function decryptSecret(secretId: string) {
  // 1. Get the encrypted data from server
  const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/decrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: getWalletAddress(),
      signature: await getSignature()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch encrypted secret');
  }

  const encryptedData = await response.json();

  // 2. Use wallet to decrypt (implement this based on your wallet library)
  const privateKey = await getWalletPrivateKey(); // Your wallet access method
  const aesKey = decryptAesKeyWithPrivateKey(
    encryptedData.encryptedAesKey,
    encryptedData.nonce,
    encryptedData.ephemeralPublicKey,
    privateKey
  );

  // 3. Use decrypted AES key to decrypt the secret value
  const secretValue = decryptWithAesKey(
    encryptedData.encryptedValue, 
    aesKey
  );

  return secretValue;
}

// Utility function to get the wallet address
function getWalletAddress(): string | null {
  // Get the wallet address from localStorage or session
  const storedAddress = localStorage.getItem('solkey:walletAddress');
  if (storedAddress) return storedAddress;
  
  console.error('Wallet address not found in storage');
  return null;
}

// Utility function to get the signature
async function getSignature(): Promise<string | null> {
  // Get the signature from localStorage that was stored during auth
  const signature = localStorage.getItem('solkey:signature');
  if (signature) return signature;
  
  console.error('Signature not found in storage');
  return null;
}

// Utility function to get the wallet's private key
async function getWalletPrivateKey(): Promise<string> {
  // Replace with actual wallet library logic
  return "example-private-key"; // Example private key
}

// Utility function to decrypt AES key with private key
function decryptAesKeyWithPrivateKey(
  encryptedAesKey: string,
  nonce: string,
  ephemeralPublicKey: string,
  privateKey: string
): string {
  // Replace with actual decryption logic
  console.log("Decrypting AES key with private key...");
  return "example-decrypted-aes-key"; // Example decrypted AES key
}

// Utility function to decrypt data with AES key
function decryptWithAesKey(encryptedValue: string, aesKey: string): string {
  // Replace with actual AES decryption logic
  console.log("Decrypting data with AES key...");
  return "example-decrypted-value"; // Example decrypted value
}

// Import the improved decryption method
import { decryptSecret as decryptSecretFromLib } from "@/lib/secret-decryptor";

// Update the decrypt method
export async function decryptSecretWithWallet(
  encryptedValue: string,
  iv: string,
  authTag: string
): Promise<string> {
  try {
    console.log("Starting decryption with improved method:", { 
      encryptedValueLength: encryptedValue?.length || 0,
      ivLength: iv?.length || 0,
      authTagLength: authTag?.length || 0
    });
    
    // Use the improved decryptSecret function from secret-decryptor.ts
    return await decryptSecretFromLib(encryptedValue, iv, authTag);
  } catch (error) {
    console.error('Error in decryptSecretWithWallet:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Helper function for base64 to Uint8Array conversion
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    // For compatibility with all browsers
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Base64 conversion error:", error);
    throw new Error("Failed to convert base64 data");
  }
}

// Helper for hex to Uint8Array conversion
function hexToUint8Array(hex: string): Uint8Array {
  // Ensure the hex string is valid
  if (!hex || typeof hex !== 'string') {
    console.error('Invalid hex string provided:', hex);
    return new Uint8Array(0);
  }

  // Remove any non-hex characters (like 0x prefix or spaces)
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  
  // Ensure we have an even number of characters (each byte is 2 hex chars)
  if (cleanHex.length % 2 !== 0) {
    console.warn('Hex string has odd length, padding with 0:', cleanHex);
  }
  
  // Add a leading zero if needed to ensure even length
  const paddedHex = cleanHex.length % 2 !== 0 ? '0' + cleanHex : cleanHex;
  
  // Convert the hex string to bytes
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = parseInt(paddedHex.substring(i, i + 2), 16);
  }
  
  // Log the conversion result for debugging
  console.log(`Converted hex string (length ${hex.length}) to Uint8Array (length ${bytes.length})`);
  
  return bytes;
}

// Storage key for encryption key
const ENCRYPTION_KEY_STORAGE_KEY = 'solkey:encryption-key';

// Diagnostic function to check browser's WebCrypto compatibility
interface WebCryptoCompatibilityDetails {
  error?: string;
  cryptoSubtle?: string;
  generateKey?: string;
  keyLength?: number;
  encrypt12ByteIV?: string;
  decrypt12ByteIV?: string;
  encrypt16ByteIV?: string;
  decrypt16ByteIV?: string;
  [key: string]: any; // Allow additional properties
}

export async function checkWebCryptoCompatibility(): Promise<{ 
  supported: boolean; 
  details: WebCryptoCompatibilityDetails;
  iv12Supported: boolean;
  iv16Supported: boolean;
}> {
  const results = {
    supported: false,
    details: {} as WebCryptoCompatibilityDetails,
    iv12Supported: false,
    iv16Supported: false
  };
  
  try {
    // Check if crypto.subtle is available
    if (!window.crypto || !window.crypto.subtle) {
      results.details.error = "WebCrypto API (crypto.subtle) is not available in this browser";
      return results;
    }
    
    results.details.cryptoSubtle = "Available";
    
    // Test generating an AES-GCM key
    try {
      const testKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      results.details.generateKey = "Supported";
      
      // Export the key to check its format
      const exportedKey = await window.crypto.subtle.exportKey("raw", testKey);
      results.details.keyLength = exportedKey.byteLength;
      
      // Test encryption with 12-byte IV (standard for WebCrypto)
      const testData = new TextEncoder().encode("test data for WebCrypto");
      const iv12 = crypto.getRandomValues(new Uint8Array(12));
      
      try {
        const encrypted12 = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv12, tagLength: 128 },
          testKey,
          testData
        );
        results.details.encrypt12ByteIV = "Supported";
        results.iv12Supported = true;
        
        // Test decryption with 12-byte IV
        try {
          const decrypted12 = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv12, tagLength: 128 },
            testKey,
            encrypted12
          );
          results.details.decrypt12ByteIV = "Supported";
        } catch (decryptError) {
          results.details.decrypt12ByteIV = `Failed: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}`;
        }
      } catch (encryptError) {
        results.details.encrypt12ByteIV = `Failed: ${encryptError instanceof Error ? encryptError.message : String(encryptError)}`;
      }
      
      // Test with 16-byte IV (Node.js standard)
      const iv16 = crypto.getRandomValues(new Uint8Array(16));
      
      try {
        const encrypted16 = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv16, tagLength: 128 },
          testKey,
          testData
        );
        results.details.encrypt16ByteIV = "Supported";
        results.iv16Supported = true;
        
        // Test decryption with 16-byte IV
        try {
          const decrypted16 = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv16, tagLength: 128 },
            testKey,
            encrypted16
          );
          results.details.decrypt16ByteIV = "Supported";
        } catch (decryptError) {
          results.details.decrypt16ByteIV = `Failed: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}`;
        }
      } catch (encryptError) {
        results.details.encrypt16ByteIV = `Failed: ${encryptError instanceof Error ? encryptError.message : String(encryptError)}`;
      }
      
    } catch (keyGenError) {
      results.details.generateKey = `Failed: ${keyGenError instanceof Error ? keyGenError.message : String(keyGenError)}`;
      return results;
    }
    
    // Overall WebCrypto support
    results.supported = results.iv12Supported || results.iv16Supported;
    
    return results;
  } catch (error) {
    results.details.error = error instanceof Error ? error.message : String(error);
    return results;
  }
}