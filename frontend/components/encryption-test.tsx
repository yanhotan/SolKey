import { useState } from 'react';
import { useWalletEncryption } from '../hooks/use-wallet-encryption';
import type { EncryptedData } from '../lib/crypto';

export function EncryptionTest() {
  const { isInitialized, handleSignMessage, encryptData, decryptData, error } = useWalletEncryption();
  const [testInput, setTestInput] = useState('');
  const [encryptedData, setEncryptedData] = useState<EncryptedData | null>(null);
  const [decryptedData, setDecryptedData] = useState('');
  const [testError, setTestError] = useState<string | null>(null);

  const handleEncrypt = async () => {
    try {
      setTestError(null);
      const encrypted = await encryptData(testInput);
      setEncryptedData(encrypted);
      setDecryptedData('');
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Encryption failed');
    }
  };

  const handleDecrypt = async () => {
    try {
      setTestError(null);
      if (!encryptedData) {
        throw new Error('No encrypted data available');
      }
      const decrypted = await decryptData(encryptedData);
      setDecryptedData(decrypted);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Decryption failed');
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Encryption Test</h2>
        <button
          onClick={handleSignMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Initialize Encryption
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Encryption Test</h2>
      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter text to encrypt"
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEncrypt}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Encrypt
          </button>
          <button
            onClick={handleDecrypt}
            disabled={!encryptedData}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Decrypt
          </button>
        </div>
        {encryptedData && (
          <div>
            <h3 className="font-bold">Encrypted:</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(encryptedData, null, 2)}
            </pre>
          </div>
        )}
        {decryptedData && (
          <div>
            <h3 className="font-bold">Decrypted:</h3>
            <pre className="bg-gray-100 p-2 rounded">{decryptedData}</pre>
          </div>
        )}
        {testError && <p className="text-red-500">{testError}</p>}
      </div>
    </div>
  );
}
