import { decode as bs58Decode, encode as bs58Encode } from 'bs58';
import * as nacl from 'tweetnacl';

export interface EncryptedData {
  encrypted: string;
  iv: string; // Changed from nonce to iv to match our implementation
}

export const deriveEncryptionKey = async (message: string, signature: string): Promise<Uint8Array> => {
  const signatureBytes = bs58Decode(signature);
  const messageBytes = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array([...messageBytes, ...signatureBytes]));
  return new Uint8Array(hash);
};

export const encryptData = (
  data: string,
  encryptionKey: Uint8Array
): EncryptedData => {
  const messageBytes = new TextEncoder().encode(data);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encryptedBytes = nacl.secretbox(messageBytes, nonce, encryptionKey);
  
  return {
    encrypted: bs58Encode(encryptedBytes),
    iv: bs58Encode(nonce) // Changed from nonce to iv to match our implementation
  };
};

export const decryptData = (
  encryptedData: EncryptedData,
  encryptionKey: Uint8Array
): string | null => {
  try {
    const decrypted = nacl.secretbox.open(
      bs58Decode(encryptedData.encrypted),
      bs58Decode(encryptedData.iv), // Changed from nonce to iv to match our implementation
      encryptionKey
    );
    
    if (!decrypted) return null;
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const TEST_MESSAGE = 'SolKey Authentication';
