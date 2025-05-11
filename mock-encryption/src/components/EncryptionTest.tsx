import type { FC } from 'react';
import { useState, useEffect } from 'react';
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
  Badge
} from '@chakra-ui/react';
import * as bs58 from 'bs58';
import type { EncryptedData } from '../utils/crypto';
import { 
  deriveEncryptionKey, 
  encryptData, 
  decryptData, 
  TEST_MESSAGE
} from '../utils/crypto';

const STORAGE_KEY = 'solkey_encryption_data';

interface StoredEncryptionData {
  signature: string;
  key: string; // base64 encoded key
}

export const EncryptionTest: FC = () => {
  const { signMessage, publicKey, connected } = useWallet();
  const toast = useToast();
  
  const [secret, setSecret] = useState('');
  const [encryptedData, setEncryptedData] = useState<EncryptedData | null>(null);
  const [decryptedData, setDecryptedData] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [persistenceTestResult, setPersistenceTestResult] = useState<boolean | null>(null);

  // Load saved encryption data on mount and wallet connection
  useEffect(() => {
    if (connected) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData) as StoredEncryptionData;
          setSignature(parsed.signature);
          const key = Uint8Array.from(atob(parsed.key).split('').map(c => c.charCodeAt(0)));
          setEncryptionKey(key);
        } catch (err) {
          console.error('Failed to restore encryption data:', err);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } else {
      // Clear data when wallet disconnects
      handleClearData();
    }
  }, [connected]);

  const handleClearData = () => {
    setSignature(null);
    setEncryptionKey(null);
    setEncryptedData(null);
    setDecryptedData(null);
    setPersistenceTestResult(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSignMessage = async () => {
    try {
      if (!signMessage || !publicKey) {
        throw new Error('Wallet not connected');
      }

      const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
      const signatureBytes = await signMessage(messageBytes);
      const signatureString = bs58.encode(signatureBytes);
      setSignature(signatureString);

      // Derive encryption key
      const key = await deriveEncryptionKey(TEST_MESSAGE, signatureString);
      setEncryptionKey(key);

      // Store in local storage
      const storageData: StoredEncryptionData = {
        signature: signatureString,
        key: btoa(String.fromCharCode(...key))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

      toast({
        title: 'Message signed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      handleClearData();
      toast({
        title: 'Error signing message',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEncrypt = () => {
    try {
      if (!encryptionKey) {
        throw new Error('Please sign the message first');
      }
      
      const encrypted = encryptData(secret, encryptionKey);
      setEncryptedData(encrypted);
      setDecryptedData(null); // Clear previous decrypted data
      
      toast({
        title: 'Data encrypted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error encrypting data',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDecrypt = () => {
    try {
      if (!encryptionKey || !encryptedData) {
        throw new Error('Please encrypt data first');
      }
      
      const decrypted = decryptData(encryptedData, encryptionKey);
      if (!decrypted) {
        throw new Error('Decryption failed');
      }
      
      setDecryptedData(decrypted);
      toast({
        title: 'Data decrypted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error decrypting data',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      setDecryptedData(null);
    }
  };

  const testKeyPersistence = async () => {
    try {
      if (!signMessage || !publicKey || !encryptedData) {
        throw new Error('Please complete encryption first');
      }

      // Sign the message again
      const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
      const newSignatureBytes = await signMessage(messageBytes);
      const newSignatureString = bs58.encode(newSignatureBytes);
      
      // Derive a new key
      const newKey = await deriveEncryptionKey(TEST_MESSAGE, newSignatureString);
      
      // Try to decrypt with the new key
      const decrypted = decryptData(encryptedData, newKey);
      const success = decrypted === secret;
      setPersistenceTestResult(success);
      
      toast({
        title: success ? 'Key persistence verified' : 'Key persistence test failed',
        description: success 
          ? 'The same key was derived from a new signature' 
          : 'Different key was derived from the new signature',
        status: success ? 'success' : 'error',
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: 'Error testing key persistence',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      setPersistenceTestResult(false);
    }
  };

  const resetState = () => {
    setSecret('');
    setEncryptedData(null);
    setDecryptedData(null);
    setEncryptionKey(null);
    setPersistenceTestResult(null);
  };

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
          <Text fontWeight="bold">Step 1: Sign Message & Generate Key</Text>
          <HStack>
            <Button 
              colorScheme="blue" 
              onClick={handleSignMessage}
              isDisabled={!!encryptionKey}
            >
              Sign Message
            </Button>
            {encryptionKey && (
              <HStack spacing={2}>
                <Badge colorScheme="green">Key Generated</Badge>
                <Badge colorScheme="blue">Stored in Browser</Badge>
              </HStack>
            )}
          </HStack>
          
          {signature && (
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>Signature Hash:</Text>
              <Text fontSize="xs" fontFamily="monospace" p={2} bg="gray.100" borderRadius="md" wordBreak="break-all">
                {signature}
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 2: Test Encryption & Decryption</Text>
          <Input
            placeholder="Enter a secret message to encrypt"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            isDisabled={!encryptionKey}
          />
          <HStack>
            <Button
              colorScheme="green"
              onClick={handleEncrypt}
              isDisabled={!encryptionKey || !secret}
            >
              Encrypt
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleDecrypt}
              isDisabled={!encryptedData}
            >
              Decrypt
            </Button>
          </HStack>
          
          {encryptedData && (
            <Box>
              <Text fontWeight="semibold">Encrypted Data:</Text>
              <Textarea
                value={JSON.stringify(encryptedData, null, 2)}
                isReadOnly
                size="sm"
              />
            </Box>
          )}
          
          {decryptedData && (
            <Box>
              <Text fontWeight="semibold">Decrypted Result:</Text>
              <Text>{decryptedData}</Text>
            </Box>
          )}
        </VStack>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold">Step 3: Test Key Persistence</Text>
          <Text fontSize="sm" color="gray.600">
            Tests if the same key is derived from a new signature
          </Text>
          <HStack>
            <Button
              colorScheme="orange"
              onClick={testKeyPersistence}
              isDisabled={!encryptedData}
            >
              Test Key Persistence
            </Button>
            {persistenceTestResult !== null && (
              <Badge 
                colorScheme={persistenceTestResult ? 'green' : 'red'}
              >
                {persistenceTestResult ? 'Test Passed' : 'Test Failed'}
              </Badge>
            )}
          </HStack>
        </VStack>
      </Box>

      <Button 
        onClick={() => {
          resetState();
          handleClearData();
        }} 
        variant="outline"
        size="sm"
      >
        Reset Test & Clear Storage
      </Button>
    </VStack>
  );
};
