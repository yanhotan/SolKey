import { type FC, useEffect } from 'react';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Box, 
  Button, 
  Input, 
  Text, 
  Textarea,
  useToast,
  VStack,
  HStack,
  Badge,
  Code,
} from '@chakra-ui/react';
import { type EncryptedData } from '../utils/crypto';

// Simulated team member public keys
const TEAM_PUBLIC_KEYS = [
  'teamMember1PublicKey',
  'teamMember2PublicKey'
];

interface EncryptionLog {
  timestamp: string;
  action: string;
  details: any;
}

interface NewEncryptionTestProps {
  onDataShared?: (encryptedApiKey: EncryptedData, encryptedAesKeys: {[key: string]: string}) => void;
}

export const NewEncryptionTest: FC<NewEncryptionTestProps> = ({ onDataShared }) => {
  const { connected } = useWallet();
  const toast = useToast();
  
  // State for the API key we want to protect
  const [apiKey, setApiKey] = useState('');
  
  // State for AES key generation and management
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [encryptedAesKeys, setEncryptedAesKeys] = useState<{[key: string]: string}>({});
  
  // State for encrypted data
  const [encryptedApiKey, setEncryptedApiKey] = useState<EncryptedData | null>(null);
  const [decryptedApiKey, setDecryptedApiKey] = useState<string | null>(null);
  
  // Logging state
  const [logs, setLogs] = useState<EncryptionLog[]>([]);

  // Add a log entry
  const addLog = (action: string, details: any) => {
    const log: EncryptionLog = {
      timestamp: new Date().toISOString(),
      action,
      details
    };
    setLogs(prev => [...prev, log]);
    console.log(`[${log.timestamp}] ${action}:`, details);
  };

  // Generate a new AES key
  const generateAesKey = async () => {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      setAesKey(key);
      addLog('Generated AES Key', {
        type: 'AES-GCM',
        length: 256
      });
      
      toast({
        title: 'AES Key Generated',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addLog('AES Key Generation Failed', { error: error.message });
      toast({
        title: 'Failed to generate AES key',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Encrypt API key with AES key
  const encryptApiKey = async () => {
    if (!aesKey || !apiKey) {
      toast({
        title: 'Error',
        description: 'Please generate AES key and enter API key first',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Generate a random IV (initialization vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(apiKey);

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        aesKey,
        encodedData
      );

      // Convert to base64 for storage
      const encryptedData: EncryptedData = {
        encrypted: Buffer.from(encrypted).toString('base64'),
        iv: Buffer.from(iv).toString('base64')
      };

      setEncryptedApiKey(encryptedData);
      addLog('Encrypted API Key', {
        inputLength: apiKey.length,
        encryptedLength: encryptedData.encrypted.length,
        iv: encryptedData.iv
      });

      toast({
        title: 'API Key Encrypted',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addLog('API Key Encryption Failed', { error: error.message });
      toast({
        title: 'Encryption failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Decrypt API key with AES key
  const decryptApiKey = async () => {
    if (!aesKey || !encryptedApiKey) {
      toast({
        title: 'Error',
        description: 'No encrypted data or AES key available',
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
        aesKey,
        encryptedData
      );

      const decryptedText = new TextDecoder().decode(decrypted);
      setDecryptedApiKey(decryptedText);
      addLog('Decrypted API Key', {
        success: true,
        decryptedLength: decryptedText.length
      });

      toast({
        title: 'API Key Decrypted',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addLog('API Key Decryption Failed', { error: error.message });
      toast({
        title: 'Decryption failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Export AES key for team members (simulated)
  const exportAesKeyForTeam = async () => {
    if (!aesKey) {
      toast({
        title: 'Error',
        description: 'Please generate AES key first',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Export the AES key
      const rawKey = await crypto.subtle.exportKey('raw', aesKey);
      const keyBytes = new Uint8Array(rawKey);

      // Simulate encrypting the AES key for each team member's public key
      const encryptedKeys: {[key: string]: string} = {};
      for (const memberPubKey of TEAM_PUBLIC_KEYS) {
        // In a real implementation, we would use the team member's public key
        // to encrypt the AES key. Here we're just simulating it.
        const simulatedEncryptedKey = Buffer.from(keyBytes).toString('base64');
        encryptedKeys[memberPubKey] = simulatedEncryptedKey;
      }

      setEncryptedAesKeys(encryptedKeys);
      addLog('Exported AES Key for Team', {
        numberOfRecipients: TEAM_PUBLIC_KEYS.length,
        recipients: TEAM_PUBLIC_KEYS
      });

      toast({
        title: 'AES Key Exported',
        description: `Encrypted for ${TEAM_PUBLIC_KEYS.length} team members`,
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addLog('AES Key Export Failed', { error: error.message });
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Clear all state and logs
  const resetTest = () => {
    setApiKey('');
    setAesKey(null);
    setEncryptedAesKeys({});
    setEncryptedApiKey(null);
    setDecryptedApiKey(null);
    setLogs([]);
    addLog('Reset Test', { timestamp: new Date().toISOString() });
  };

  // Notify parent when data is ready to share
  useEffect(() => {
    if (encryptedApiKey && Object.keys(encryptedAesKeys).length > 0) {
      onDataShared?.(encryptedApiKey, encryptedAesKeys);
    }
  }, [encryptedApiKey, encryptedAesKeys, onDataShared]);

  if (!connected) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg">
        <Text>Please connect your wallet to test encryption</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 1: Generate AES Key</Text>
          <Button
            colorScheme="blue"
            onClick={generateAesKey}
            isDisabled={!!aesKey}
          >
            Generate AES Key
          </Button>
          {aesKey && (
            <Badge colorScheme="green">AES Key Generated</Badge>
          )}
        </VStack>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 2: Enter API Key & Encrypt</Text>
          <Input
            placeholder="Enter an API key to encrypt"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            isDisabled={!aesKey}
          />
          <HStack>
            <Button
              colorScheme="green"
              onClick={encryptApiKey}
              isDisabled={!aesKey || !apiKey}
            >
              Encrypt API Key
            </Button>
            <Button
              colorScheme="purple"
              onClick={decryptApiKey}
              isDisabled={!encryptedApiKey}
            >
              Decrypt API Key
            </Button>
          </HStack>
        </VStack>
      </Box>

      {encryptedApiKey && (
        <Box p={4} borderWidth={1} borderRadius="lg">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">Encrypted Data:</Text>
            <Textarea
              value={JSON.stringify(encryptedApiKey, null, 2)}
              isReadOnly
              size="sm"
              fontFamily="monospace"
            />
          </VStack>
        </Box>
      )}

      {decryptedApiKey && (
        <Box p={4} borderWidth={1} borderRadius="lg">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">Decrypted API Key:</Text>
            <Text fontFamily="monospace">{decryptedApiKey}</Text>
          </VStack>
        </Box>
      )}

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 3: Export AES Key for Team</Text>
          <Button
            colorScheme="orange"
            onClick={exportAesKeyForTeam}
            isDisabled={!aesKey}
          >
            Export AES Key for Team
          </Button>
          {Object.keys(encryptedAesKeys).length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={2}>Encrypted AES Keys for Team:</Text>
              {Object.entries(encryptedAesKeys).map(([pubKey, encryptedKey]) => (
                <Box key={pubKey} mb={2}>
                  <Text fontSize="sm">Member: {pubKey}</Text>
                  <Code fontSize="xs" p={1}>{encryptedKey.slice(0, 50)}...</Code>
                </Box>
              ))}
            </Box>
          )}
        </VStack>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Encryption Logs:</Text>
          <Box maxH="300px" overflowY="auto">
            {logs.map((log, index) => (
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