'use client';

import { PermissionProgramTester } from '@/components/PermissionProgramTester';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export default function PermissionTestPage() {
  const { connected, connecting, publicKey } = useWallet();
  const [isClient, setIsClient] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Solana Permission Program Test</h1>
      
      <div className="mb-6">
        <WalletMultiButton />
        {connecting && (
          <p className="mt-2 text-sm text-blue-500">Connecting to wallet...</p>
        )}
        {connected && publicKey && (
          <p className="mt-2 text-sm text-green-500">
            Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </p>
        )}
      </div>
      
      {connected ? (
        <PermissionProgramTester />
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            Please connect your wallet to use the permission program tester.
          </p>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-600">
        <p>This page allows you to test the Solana permission program functionality:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Initialize a new project (creates a PDA owned by your connected wallet)</li>
          <li>Add team members to your project by their wallet addresses</li>
          <li>Remove team members from your project</li>
          <li>Check if a wallet address is a member of a specific project</li>
        </ul>
      </div>
    </div>
  );
} 