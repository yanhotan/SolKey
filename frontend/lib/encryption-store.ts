const ENCRYPTION_KEY_STORAGE_KEY = 'solkey_encryption_key';

// Get key from localStorage if available
function getStoredKey(): Uint8Array | null {
  try {
    const stored = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    if (!stored) return null;
    
    // Convert stored hex string back to Uint8Array
    const hex = stored.startsWith('0x') ? stored.slice(2) : stored;
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return arr;
  } catch (error) {
    console.error('Failed to get encryption key from storage:', error);
    return null;
  }
}

// Store key in localStorage
function storeKey(key: Uint8Array | null): void {
  try {
    if (key) {
      // Convert Uint8Array to hex string for storage
      const hex = Array.from(key)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, '0x' + hex);
    } else {
      localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to store encryption key:', error);
  }
}

// In-memory cache of the encryption key
let encryptionKey: Uint8Array | null = getStoredKey();

export function setEncryptionKey(key: Uint8Array | null): void {
  encryptionKey = key;
  storeKey(key);
}

export function getEncryptionKey(): Uint8Array {
  // Try to get from memory first
  if (encryptionKey) return encryptionKey;
  
  // If not in memory, try to get from storage
  const storedKey = getStoredKey();
  if (storedKey) {
    encryptionKey = storedKey;
    return storedKey;
  }
  
  throw new Error('Encryption key not available. Please connect your wallet and sign the message first.');
}

export function hasEncryptionKey(): boolean {
  return encryptionKey !== null || getStoredKey() !== null;
}

// Clear the encryption key (useful for logout)
export function clearEncryptionKey(): void {
  encryptionKey = null;
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
}
