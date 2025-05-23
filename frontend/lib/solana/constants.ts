import { PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Program ID from your deployed program
export const PERMISSION_PROGRAM_ID = new PublicKey(
  "A3Y68w5bTR4y8GkT9hPKXQ8AXYNTivFCiA3D9QkAkC9j"  // Your actual program ID
);

// Network configuration
export const NETWORK = WalletAdapterNetwork.Devnet;  // or .Mainnet for production

// RPC endpoints
export const ENDPOINTS = {
  [WalletAdapterNetwork.Devnet]: "https://api.devnet.solana.com",
  [WalletAdapterNetwork.Mainnet]: "https://api.mainnet-beta.solana.com",
};

// Current endpoint
export const ENDPOINT = ENDPOINTS[NETWORK];