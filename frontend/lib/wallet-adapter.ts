import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter 
} from '@solana/wallet-adapter-wallets';
import { Commitment, clusterApiUrl, ConnectionConfig } from '@solana/web3.js';

const network = WalletAdapterNetwork.Devnet;
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

// Centralized wallet configuration
export const WALLET_CONFIG = {
  network,
  endpoint: clusterApiUrl(network),
  wallets,
  signatureMessage: 'auth-to-decrypt',
  persistenceKey: 'solkey_encryption_data'
} as const;

export const SOLANA_CONFIG: ConnectionConfig = {
  commitment: 'processed' as Commitment,
  confirmTransactionInitialTimeout: 60000
};
