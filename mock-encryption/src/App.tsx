import { useState } from 'react'
import { ChakraProvider, Container, Grid, GridItem } from '@chakra-ui/react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { NewEncryptionTest } from './components/NewEncryptionTest'
import { TeamMemberTest } from './components/TeamMemberTest'
import { WalletConnection } from './components/WalletConnection'
import { type EncryptedData } from './utils/crypto'
import './App.css'
import '@solana/wallet-adapter-react-ui/styles.css'

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
]
const endpoint = "https://api.devnet.solana.com"

function App() {
  // State for passing encrypted data from owner to team member
  const [sharedEncryptedApiKey, setSharedEncryptedApiKey] = useState<EncryptedData | null>(null);
  const [sharedEncryptedAesKey, setSharedEncryptedAesKey] = useState<string | null>(null);

  // Callback to receive encrypted data from owner
  const handleDataShared = (apiKey: EncryptedData, aesKey: {[key: string]: string}) => {
    setSharedEncryptedApiKey(apiKey);
    // For demo, we'll use the first team member's encrypted AES key
    const firstMemberKey = Object.values(aesKey)[0];
    setSharedEncryptedAesKey(firstMemberKey);
  };

  return (
    <ChakraProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>            <Container maxW="container.xl" py={8}>
              <WalletConnection />
              <Grid templateColumns="repeat(2, 1fr)" gap={8}>
                <GridItem>
                  <NewEncryptionTest
                    onDataShared={handleDataShared}
                  />
                </GridItem>
                <GridItem>
                  <TeamMemberTest
                    encryptedApiKey={sharedEncryptedApiKey}
                    encryptedAesKeyForMember={sharedEncryptedAesKey}
                  />
                </GridItem>
              </Grid>
            </Container>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  );
}

export default App
