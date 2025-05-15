/**
 * Helper functions for the api.ts file to fix TypeScript compilation issues
 */

/**
 * Convert a hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  // Remove any non-hex characters (like spaces)
  const cleanHex = hex.replace(/[^0-9a-f]/gi, '');
  
  // Make sure we have a valid hex string (even length)
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
  
  // Convert to byte array
  const matches = paddedHex.match(/[0-9a-f]{2}/gi) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
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
 * Get wallet address from storage
 */
export function getWalletAddress(): string | null {
  return localStorage.getItem('solkey:walletAddress');
}

/**
 * Constants
 */
export const ENCRYPTION_KEY_STORAGE_KEY = 'solkey:encryption-key';
