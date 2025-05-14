'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { 
  convertPublicKeyToX25519, 
  ed2curve, 
  decryptAesKeyWithSignature,
  decryptAesKeyWithWallet,
  encryptAesKeyForWallet
} from '../lib/wallet-crypto';

const CryptoTestComponent = () => {
  const { publicKey, signMessage } = useWallet();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [targetPubkey, setTargetPubkey] = useState<string>('');

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const resetResults = () => {
    setTestResults([]);
    setError(null);
  };

  const testKeyConversion = async () => {
    try {
      resetResults();
      addResult('Testing key conversion...');

      // Get our actual public key
      if (!publicKey) {
        setError('Please connect your wallet first');
        return;
      }

      const pubkeyBase58 = publicKey.toBase58();
      addResult(`Wallet public key: ${pubkeyBase58}`);
      
      // Test public key conversion with our wallet
      const pubkeyBytes = bs58.decode(pubkeyBase58);
      addResult(`Decoded public key bytes length: ${pubkeyBytes.length}`);

      // First test our internal implementation
      const internalConverted = ed2curve.convertPublicKey(pubkeyBytes);
      if (internalConverted) {
        addResult(`✅ Internal ed2curve conversion successful: ${Buffer.from(internalConverted).toString('hex').substring(0, 16)}...`);
      } else {
        addResult(`❌ Internal ed2curve conversion failed`);
      }

      // Then test our fallback implementation
      const converted = convertPublicKeyToX25519(pubkeyBytes);
      addResult(`Converted X25519 public key length: ${converted.length}`);
      addResult(`Converted X25519 public key (hex): ${Buffer.from(converted).toString('hex').substring(0, 16)}...`);

      addResult('Key conversion test completed successfully');
    } catch (err) {
      console.error('Key conversion test failed:', err);
      setError(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const testEncryptDecrypt = async () => {
    try {
      resetResults();
      addResult('Testing encryption and decryption cycle...');
      
      if (!publicKey) {
        setError('Please connect your wallet first');
        return;
      }

      if (!signMessage) {
        setError('Wallet does not support signing');
        return;
      }

      // Generate a test AES key (32 bytes for AES-256)
      const testAesKey = nacl.randomBytes(32);
      addResult(`Generated test AES key: ${Buffer.from(testAesKey).toString('hex').substring(0, 16)}...`);

      // Sign a consistent message for key derivation
      const seedMessage = new TextEncoder().encode('test-signing-seed');
      let seedSignature: Uint8Array;
      
      try {
        addResult('Signing test message...');
        seedSignature = await signMessage(seedMessage);
        addResult(`Seed signature obtained: ${Buffer.from(seedSignature).toString('hex').substring(0, 16)}...`);
      } catch (err) {
        setError(`Signing failed: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }

      // Encrypt the AES key for our wallet using the signature
      const targetWalletAddress = targetPubkey || publicKey.toBase58();
      addResult(`Target wallet for encryption: ${targetWalletAddress}`);
      
      // Use our improved signature-based encryption
      const encryptionResult = encryptAesKeyForWallet(
        testAesKey, 
        targetWalletAddress,
        seedSignature // Pass the signature for consistent derivation
      );
      
      addResult(`Encrypted AES key (base64): ${encryptionResult.encryptedKey.substring(0, 20)}...`);
      addResult(`Encryption nonce (base64): ${encryptionResult.nonce}`);
      addResult(`Ephemeral public key (base64): ${encryptionResult.ephemeralPublicKey.substring(0, 20)}...`);

      // Decrypt using the same signature as used during encryption
      try {
        addResult('Attempting to decrypt AES key with the same signature...');
        
        const decryptedWithSignature = decryptAesKeyWithSignature(
          encryptionResult.encryptedKey,
          encryptionResult.nonce,
          encryptionResult.ephemeralPublicKey,
          seedSignature // Use the same signature as in encryption
        );
        
        const decryptedAesKeyHex = Buffer.from(decryptedWithSignature).toString('hex');
        const originalAesKeyHex = Buffer.from(testAesKey).toString('hex');
        
        addResult(`Decrypted AES key (hex): ${decryptedAesKeyHex.substring(0, 16)}...`);
        addResult(`Original AES key (hex):  ${originalAesKeyHex.substring(0, 16)}...`);
        
        const keysMatch = decryptedAesKeyHex === originalAesKeyHex;
        if (keysMatch) {
          addResult('✅ Keys match! Decryption successful');
        } else {
          addResult('❌ Keys do not match! Decryption produced incorrect result');
        }
      } catch (err) {
        addResult(`❌ Decryption with signature failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Test if nonce bytes are preserved correctly
      const nonceDifferent = Buffer.from(encryptionResult.nonce.slice(0, 24)).toString('hex') !== 
                             Buffer.from(encryptionResult.nonce).toString('hex');
      addResult(`Nonce conversion check: ${nonceDifferent ? 'ISSUE DETECTED' : 'OK'}`);
  
      addResult('Encryption/decryption test completed');
    } catch (err) {
      console.error('Encryption/decryption test failed:', err);
      setError(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Card className="mt-4 mb-4">
      <CardHeader>
        <CardTitle>Crypto System Test Component</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-4">
          <Label htmlFor="targetPubkey">Target Public Key (leave empty for self)</Label>
          <Input
            id="targetPubkey"
            value={targetPubkey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetPubkey(e.target.value)}
            className="mt-1"
            placeholder="Optional: Solana address to encrypt for"
          />
        </div>
        
        <div className="flex gap-2 mb-6">
          <Button variant="default" onClick={testKeyConversion}>
            Test Key Conversion
          </Button>
          <Button variant="secondary" onClick={testEncryptDecrypt}>
            Test Encrypt/Decrypt
          </Button>
          <Button variant="outline" onClick={resetResults}>
            Clear Results
          </Button>
        </div>
        
        <h3 className="text-lg font-medium mb-2">Test Results:</h3>
        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md max-h-[400px] overflow-auto font-mono text-sm whitespace-pre-wrap break-all">
          {testResults.length === 0 ? (
            <p className="text-gray-500">Run a test to see results</p>
          ) : (
            testResults.map((result, i) => (
              <div key={i} className="mb-2">
                {result}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoTestComponent; 