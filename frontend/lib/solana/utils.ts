import { PublicKey } from '@solana/web3.js';

export const isValidPublicKey = (address: string): boolean => {
  try {
    if (!address || typeof address !== 'string') return false;
    
    // Simple length check (Solana addresses are typically 32-44 characters)
    if (address.length < 32 || address.length > 44) return false;
    
    // Try to create a PublicKey to validate it
    new PublicKey(address);
    return true;
  } catch (error) {
    console.warn(`Invalid public key format: ${address}`, error);
    return false;
  }
}; 