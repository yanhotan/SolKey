import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useCallback, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { PermissionProgramClient } from '../lib/solana/anchorClient';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useAnchorProviderContext } from '@/components/anchor-provider';

export function usePermissionProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorProvider = useAnchorProviderContext();
  
  const [client, setClient] = useState<PermissionProgramClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the client when wallet, connection and anchorProvider are available
  useEffect(() => {
    if (wallet && connection && wallet.publicKey && anchorProvider) {
      try {
        console.log("Initializing permission client with wallet:", wallet.publicKey.toString());
        // Pass the anchorProvider directly to the client
        const permissionClient = new PermissionProgramClient(connection, wallet, anchorProvider as AnchorProvider);
        setClient(permissionClient);
        setError(null);
      } catch (err: any) {
        console.error('Failed to initialize permission program client:', err);
        setError(err.message || 'Failed to initialize client');
        setClient(null);
      }
    } else {
      // Clear client if wallet is disconnected
      setClient(null);
      if (!wallet.publicKey && wallet.connected === false) {
        setError('Please connect your wallet to use this feature');
      } else if (!anchorProvider) {
        console.log("Waiting for Anchor Provider to be available...");
      }
    }
  }, [wallet, connection, wallet.publicKey, wallet.connected, anchorProvider]);

  // Initialize a new project
  const initializeProject = useCallback(async () => {
    if (!client) {
      setError('Client not initialized. Connect your wallet first.');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.initializeProject();
      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Failed to initialize project:', err);
      setError(err.message || 'Failed to initialize project');
      setLoading(false);
      return null;
    }
  }, [client]);

  // Add a member to a project
  const addMember = useCallback(async (memberAddress: string) => {
    if (!client) {
      setError('Client not initialized. Connect your wallet first.');
      return null;
    }
    
    if (!memberAddress) {
      setError('Member address is required.');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate public key before creating it
      if (!isValidPublicKeyString(memberAddress)) {
        setError('Invalid member address format');
        setLoading(false);
        return null;
      }
      
      const memberPublicKey = new PublicKey(memberAddress);
      const tx = await client.addMember(memberPublicKey);
      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Failed to add member:', err);
      setError(err.message || 'Failed to add member');
      setLoading(false);
      return null;
    }
  }, [client]);

  // Remove a member from a project
  const removeMember = useCallback(async (memberAddress: string) => {
    if (!client) {
      setError('Client not initialized. Connect your wallet first.');
      return null;
    }
    
    if (!memberAddress) {
      setError('Member address is required.');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate public key before creating it
      if (!isValidPublicKeyString(memberAddress)) {
        setError('Invalid member address format');
        setLoading(false);
        return null;
      }
      
      const memberPublicKey = new PublicKey(memberAddress);
      const tx = await client.removeMember(memberPublicKey);
      setLoading(false);
      return tx;
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.message || 'Failed to remove member');
      setLoading(false);
      return null;
    }
  }, [client]);

  // Check if a wallet address is a member of a project
  const checkIsMember = useCallback(async (memberAddress: string, projectOwnerAddress: string) => {
    if (!client) {
      setError('Client not initialized. Connect your wallet first.');
      return false;
    }
    
    if (!memberAddress || !projectOwnerAddress) {
      setError('Member address and project owner address are required.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate public keys before creating them
      if (!isValidPublicKeyString(memberAddress)) {
        setError('Invalid member address format');
        setLoading(false);
        return false;
      }
      
      if (!isValidPublicKeyString(projectOwnerAddress)) {
        setError('Invalid project owner address format');
        setLoading(false);
        return false;
      }
      
      const memberPublicKey = new PublicKey(memberAddress);
      const projectOwnerPublicKey = new PublicKey(projectOwnerAddress);
      
      const isMember = await client.checkIsMember(memberPublicKey, projectOwnerPublicKey);
      setLoading(false);
      
      if (!isMember) {
        setError('Address is not a member of this project');
        return false;
      }
      
      return isMember;
    } catch (err: any) {
      console.error('Failed to check membership:', err);
      if (err.message?.includes('MemberNotFound')) {
        setError('Address is not a member of this project');
      } else {
        setError(err.message || 'Failed to check membership');
      }
      setLoading(false);
      return false;
    }
  }, [client]);

  // Helper function to validate a public key string
  const isValidPublicKeyString = (address: string): boolean => {
    try {
      // Check if it's a valid base58 string of correct length
      if (!address || typeof address !== 'string') return false;
      
      // Simple length check (Solana addresses are typically 32-44 characters)
      if (address.length < 32 || address.length > 44) return false;
      
      // Try to create a PublicKey to validate it
      new PublicKey(address);
      return true;
    } catch (error) {
      console.warn(`Invalid public key format: ${address}`, error);
      return false;
    }
  };

  return {
    initialized: !!client,
    loading,
    error,
    initializeProject,
    addMember,
    removeMember,
    checkIsMember,
  };
} 