import bs58 from 'bs58';

export interface EncryptedData {
  encrypted: string;
  nonce: string;
  authHash: string;
}

export const TEST_MESSAGE = 'Welcome to SolKey! Sign this message to secure your secrets with your Phantom wallet.';

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new globalThis.TextEncoder();
  return encoder.encode(str);
}

// Convert Uint8Array to string
function uint8ArrayToString(arr: Uint8Array): string {
  const decoder = new globalThis.TextDecoder();
  return decoder.decode(arr);
}

// Convert hex string to Uint8Array
export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

// Convert Uint8Array to hex string
export function uint8ArrayToHex(arr: Uint8Array): string {
  return '0x' + Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Derive encryption key from signature
export async function deriveEncryptionKey(message: string, signature: string): Promise<Uint8Array> {
  try {
    const signatureBytes = bs58.decode(signature);
    const messageBytes = stringToUint8Array(message);
    
    // Create a key from message and signature
    const combinedBytes = new Uint8Array([...messageBytes, ...signatureBytes]);
    
    // Hash the combined bytes to create the encryption key
    const hashBuffer = await crypto.subtle.digest('SHA-256', combinedBytes);
    return new Uint8Array(hashBuffer);
  } catch (error) {
    console.error('Error deriving encryption key:', error);
    throw new Error('Failed to derive encryption key');
  }
}

export async function encrypt(data: string, keyBytes: Uint8Array): Promise<EncryptedData> {
  try {
    const messageBytes = stringToUint8Array(data);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const authData = stringToUint8Array('solkey-encrypted-data');

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: authData
      },
      key,
      messageBytes
    );

    return {
      encrypted: bs58.encode(new Uint8Array(encrypted)),
      nonce: bs58.encode(nonce),
      authHash: bs58.encode(new Uint8Array(await crypto.subtle.digest('SHA-256', authData)))
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export async function decrypt(encryptedData: EncryptedData, keyBytes: Uint8Array): Promise<string> {
  try {
    const encryptedBytes = bs58.decode(encryptedData.encrypted);
    const nonce = bs58.decode(encryptedData.nonce);
    const authData = stringToUint8Array('solkey-encrypted-data');
    const authHash = bs58.encode(new Uint8Array(await crypto.subtle.digest('SHA-256', authData)));

    if (encryptedData.authHash !== authHash) {
      throw new Error('Data integrity check failed');
    }

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        additionalData: authData
      },
      key,
      encryptedBytes
    );

    return uint8ArrayToString(new Uint8Array(decrypted));
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}
