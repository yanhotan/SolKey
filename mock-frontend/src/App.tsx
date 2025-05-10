import { useMemo } from 'react';
import type { FC } from 'react';
import { ChakraProvider, Container, Heading, Stack } from '@chakra-ui/react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletConnection } from './components/WalletConnection';
import { EncryptionTest } from './components/EncryptionTest';
import '@solana/wallet-adapter-react-ui/styles.css';

const App: FC = () => {
  // Set to 'mainnet-beta', 'testnet', or 'devnet'
  const network = WalletAdapterNetwork.Devnet;
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Initialize wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );
  
  return (
    <ChakraProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Container maxW="container.md" py={8}>
              <Stack direction="column" gap={8} align="stretch">
                <Heading>SolKey Wallet Test</Heading>
                <WalletConnection />
                <EncryptionTest />
              </Stack>
            </Container>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  );
};

export default App;
