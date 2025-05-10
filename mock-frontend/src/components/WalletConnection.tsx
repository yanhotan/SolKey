import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Box, Stack, Text } from '@chakra-ui/react';
import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletConnection: FC = () => {
  const { connected, publicKey } = useWallet();
  return (
    <Stack direction="column" gap={4} align="center" p={4}>
      <WalletMultiButton />
      {connected && publicKey && (
        <Box>
          <Text>Connected Address:</Text>
          <Text fontSize="sm" color="gray.600">
            {publicKey.toBase58()}
          </Text>
        </Box>
      )}
    </Stack>
  );
};
