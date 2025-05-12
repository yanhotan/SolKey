import { type FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Box, 
  Button, 
  Text, 
  Textarea,
  useToast,
  VStack,
  Badge,
  Code,
  Divider,
} from '@chakra-ui/react';
import { type EncryptedData } from '../utils/crypto';

interface DecryptionLog {
  timestamp: string;
  action: string;
  details: any;
}

interface TeamMemberTestProps {
  // Data received from the first user (owner)
  encryptedApiKey: EncryptedData | null;
  encryptedAesKeyForMember: string | null;
}

export const TeamMemberTest: FC<TeamMemberTestProps> = ({ 
  encryptedApiKey,
  encryptedAesKeyForMember
}) => {
  const { connected } = useWallet();
  const toast = useToast();

  // State for decrypted keys and data
  const [decryptedAesKey, setDecryptedAesKey] = useState<CryptoKey | null>(null);
  const [decryptedApiKey, setDecryptedApiKey] = useState<string | null>(null);
  
  // Logging state
  const [logs, setLogs] = useState<DecryptionLog[]>([]);

  // Add a log entry
  const addLog = (action: string, details: any) => {
    const log: DecryptionLog = {
      timestamp: new Date().toISOString(),
      action,
      details
    };
    setLogs(prev => [...prev, log]);
    console.log(`[${log.timestamp}] ${action}:`, details);
  };

  // Simulate decrypting the AES key with team member's private key
  const decryptAesKey = async () => {
    if (!encryptedAesKeyForMember) {
      toast({
        title: 'Error',
        description: 'No encrypted AES key available',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // In a real implementation, this would use the team member's private key
      // to decrypt their copy of the AES key. Here we simulate it:
      const keyBytes = Buffer.from(encryptedAesKeyForMember, 'base64');
      
      // Import the decrypted key bytes as an AES-GCM key
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      setDecryptedAesKey(key);
      addLog('Decrypted AES Key', {
        success: true,
        keyType: 'AES-GCM',
        keyLength: 256
      });

      toast({
        title: 'AES Key Decrypted',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addLog('AES Key Decryption Failed', { error: error.message });
      toast({
        title: 'Failed to decrypt AES key',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Decrypt the API key using the decrypted AES key
  const decryptApiKey = async () => {
    if (!decryptedAesKey || !encryptedApiKey) {
      toast({
        title: 'Error',
        description: 'Please decrypt AES key first',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const iv = Buffer.from(encryptedApiKey.iv, 'base64');
      const encryptedData = Buffer.from(encryptedApiKey.encrypted, 'base64');

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        decryptedAesKey,
        encryptedData
      );

      const decryptedText = new TextDecoder().decode(decrypted);
      setDecryptedApiKey(decryptedText);
      addLog('Decrypted API Key', {
        success: true,
        decryptedLength: decryptedText.length
      });

      toast({
        title: 'API Key Decrypted Successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addLog('API Key Decryption Failed', { error: error.message });
      toast({
        title: 'Failed to decrypt API key',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Reset the test
  const resetTest = () => {
    setDecryptedAesKey(null);
    setDecryptedApiKey(null);
    setLogs([]);
    addLog('Reset Test', { timestamp: new Date().toISOString() });
  };

  if (!connected) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg">
        <Text>Please connect your team member wallet to test decryption</Text>
      </Box>
    );
  }

  if (!encryptedApiKey || !encryptedAesKeyForMember) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg">
        <Text>Waiting for encrypted data from owner...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box p={4} borderWidth={1} borderRadius="lg" bg="gray.50">
        <Text fontSize="xl" fontWeight="bold" mb={4}>Team Member View</Text>
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 1: Decrypt AES Key</Text>
          <Box>
            <Text fontSize="sm" mb={2}>Encrypted AES Key received:</Text>
            <Code fontSize="xs" p={2} display="block" whiteSpace="pre-wrap">
              {encryptedAesKeyForMember.slice(0, 50)}...
            </Code>
          </Box>
          <Button
            colorScheme="blue"
            onClick={decryptAesKey}
            isDisabled={!!decryptedAesKey}
          >
            Decrypt AES Key
          </Button>
          {decryptedAesKey && (
            <Badge colorScheme="green">AES Key Decrypted Successfully</Badge>
          )}
        </VStack>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 2: Decrypt API Key</Text>
          <Box>
            <Text fontSize="sm" mb={2}>Encrypted API Key received:</Text>
            <Textarea
              value={JSON.stringify(encryptedApiKey, null, 2)}
              isReadOnly
              size="sm"
              fontFamily="monospace"
            />
          </Box>
          <Button
            colorScheme="green"
            onClick={decryptApiKey}
            isDisabled={!decryptedAesKey || !!decryptedApiKey}
          >
            Decrypt API Key
          </Button>
        </VStack>
      </Box>

      {decryptedApiKey && (
        <Box p={4} borderWidth={1} borderRadius="lg" bg="green.50">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">Decrypted API Key:</Text>
            <Text fontFamily="monospace">{decryptedApiKey}</Text>
          </VStack>
        </Box>
      )}

      <Divider />

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Decryption Logs:</Text>
          <Box maxH="300px" overflowY="auto">
            {logs.map((log: DecryptionLog, index: number) => (
              <Box key={index} mb={2} p={2} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" color="gray.500">{log.timestamp}</Text>
                <Text fontWeight="semibold">{log.action}</Text>
                <Code fontSize="xs" display="block" whiteSpace="pre-wrap">
                  {JSON.stringify(log.details, null, 2)}
                </Code>
              </Box>
            ))}
          </Box>
        </VStack>
      </Box>

      <Button onClick={resetTest} variant="outline">
        Reset Test
      </Button>
    </VStack>
  );
};