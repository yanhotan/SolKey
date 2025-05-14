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

// Use the existing wallet authentication to decrypt a secret
export async function decryptSecretWithWallet(
  encryptedValue: string,
  iv: string,
  authTag: string
): Promise<string> {
  try {
    // Enhanced logging to diagnose decryption issues
    console.log("Starting decryption with wallet-derived key:", { 
      encryptedValueLength: encryptedValue?.length || 0,
      ivLength: iv?.length || 0,
      authTagLength: authTag?.length || 0
    });
    
    // First check if we have the encryption key available
    const encryptionKey = localStorage.getItem('solkey:encryption-key');
    if (!encryptionKey) {
      console.error("No encryption key in localStorage");
      throw new Error("Encryption key not available. Please authenticate with your wallet first.");
    }
    
    // 1. Validate and decode the parameters
    if (!encryptedValue || !iv) {
      console.error("Missing required encryption parameters:", { 
        hasEncryptedValue: !!encryptedValue, 
        hasIV: !!iv 
      });
      throw new Error("Missing required encryption parameters");
    }
    
    // Import the encryption key from storage
    const keyBytes = Uint8Array.from(atob(encryptionKey).split('').map(c => c.charCodeAt(0)));
    console.log("Encryption key details:", {
      keyBytesLength: keyBytes.length,
      isCorrectLength: keyBytes.length === 32, // Should be 32 bytes for AES-256
    });
    
    if (keyBytes.length !== 32) {
      console.error("Invalid encryption key length:", keyBytes.length);
      throw new Error("Invalid encryption key format");
    }
    
    // Import the key into WebCrypto
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false, // Don't allow export
      ['decrypt']
    );
    
    // 2. Process encrypted data - handle already combined ciphertext+authTag from backend
    let encryptedBytes: Uint8Array;
    
    // The backend already combines ciphertext and authTag in the encryptedValue
    // It's returned as base64, so we need to decode it
    try {
      console.log("Decoding base64 encrypted value from backend");
      encryptedBytes = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));
      console.log("Decoded encrypted data length:", encryptedBytes.length);
    } catch (formatError) {
      console.error("Failed to decode base64 encrypted value:", formatError);
      throw new Error("Invalid encrypted data format - not valid base64");
    }
    
    // 3. Process IV correctly (should be 16 bytes)
    let ivBytes: Uint8Array;
    try {
      // The IV comes as a hex string from the backend
      console.log("Decoding hex IV");
      ivBytes = hexToUint8Array(iv);
    } catch (ivError) {
      console.error("Failed to process IV:", ivError);
      throw new Error("Invalid IV format - not valid hex");
    }
    
    if (ivBytes.length !== 16) {
      console.error("Incorrect IV length:", ivBytes.length);
      throw new Error(`IV must be exactly 16 bytes (got ${ivBytes.length})`);
    }
    
    // 4. Check data length
    if (encryptedBytes.length < 28) { // Minimum viable size (some ciphertext + 16 byte authTag)
      console.error("Encrypted data too small:", encryptedBytes.length);
      throw new Error("Encrypted data is too small to be valid");
    }
    
    // 5. Set up auth data if needed (used for verifying data integrity)
    // This should be empty for compatibility with backend Node.js crypto
    const authData = new Uint8Array(0);
    
    // 6. Attempt decryption with robust error handling
    console.log("Attempting decryption with parameters:", {
      algorithm: "AES-GCM",
      ivLength: ivBytes.length,
      encryptedDataLength: encryptedBytes.length,
      keyType: key.type,
      hasAuthData: false
    });
    
    let decrypted: ArrayBuffer;
    try {
      // Try first with the combined data as is - the most likely format from backend
      decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
          // No additional data used in backend encryption
        },
        key,
        encryptedBytes
      );
    } catch (error) {
      console.error("First decryption attempt failed:", error);
      
      try {
        console.log("Trying alternative format: isolating authTag from end");
        
        // In AES-GCM, the auth tag is the last 16 bytes
        const authTagLength = 16;
        const ciphertextLength = encryptedBytes.length - authTagLength;
        
        // Extract ciphertext and auth tag
        const ciphertext = encryptedBytes.slice(0, ciphertextLength);
        const authTagFromEnd = encryptedBytes.slice(ciphertextLength);
        
        console.log("Extracted components:", {
          ciphertextLength,
          authTagLength: authTagFromEnd.length
        });
        
        // Ensure we have valid sizes
        if (ciphertextLength <= 0 || authTagFromEnd.length !== 16) {
          throw new Error("Invalid encrypted data structure");
        }
        
        // Try using the separate authTag from the response
        if (authTag && authTag.length > 0) {
          console.log("Using separate auth tag from response");
          const separateAuthTag = hexToUint8Array(authTag);
          
          // Try explicit algorithm parameters
          decrypted = await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: ivBytes,
              tagLength: 128 // 16 bytes * 8 = 128 bits
            },
            key,
            // Use extracted ciphertext + separate auth tag
            new Uint8Array([...ciphertext, ...separateAuthTag])
          );
        } else {
          // Last attempt with just the extracted components
          decrypted = await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: ivBytes,
              tagLength: 128
            },
            key,
            // Use the original data but ensure WebCrypto understands where the authTag is
            encryptedBytes
          );
        }
      } catch (fallbackError) {
        console.error("All decryption attempts failed:", fallbackError);
        throw new Error("Decryption failed - data format incompatible with WebCrypto");
      }
    }
    
    // Success! Convert decrypted data to string
    const decryptedText = new TextDecoder().decode(decrypted);
    console.log("Decryption successful, text length:", decryptedText.length);
    
    return decryptedText;
  } catch (error) {
    console.error('Error decrypting secret:', error);
    throw new Error(`Failed to decrypt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper for hex to Uint8Array conversion
function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/[0-9a-f]{2}/gi) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// Storage key for encryption key
const ENCRYPTION_KEY_STORAGE_KEY = 'solkey:encryption-key';