import React, { useState } from 'react';
import { usePermissionProgram } from '../hooks/usePermissionProgram';
import { useWallet } from '@solana/wallet-adapter-react';

export function PermissionProgramTester() {
  const { 
    initialized, 
    loading, 
    error, 
    initializeProject, 
    addMember, 
    removeMember, 
    checkIsMember 
  } = usePermissionProgram();
  
  const { publicKey, connected } = useWallet();
  
  const [memberAddress, setMemberAddress] = useState('');
  const [projectOwnerAddress, setProjectOwnerAddress] = useState('');
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleInitializeProject = async () => {
    setStatusMessage('Initializing project...');
    try {
      const tx = await initializeProject();
      if (tx) {
        setLastTxId(tx);
        setStatusMessage('Project initialized successfully!');
      } else {
        setStatusMessage('Failed to initialize project.');
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleAddMember = async () => {
    if (!memberAddress) {
      setStatusMessage('Please enter a member address.');
      return;
    }
    
    setStatusMessage('Adding member...');
    try {
      const tx = await addMember(memberAddress);
      if (tx) {
        setLastTxId(tx);
        setStatusMessage('Member added successfully!');
      } else {
        setStatusMessage('Failed to add member.');
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberAddress) {
      setStatusMessage('Please enter a member address.');
      return;
    }
    
    setStatusMessage('Removing member...');
    try {
      const tx = await removeMember(memberAddress);
      if (tx) {
        setLastTxId(tx);
        setStatusMessage('Member removed successfully!');
      } else {
        setStatusMessage('Failed to remove member.');
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleCheckMembership = async () => {
    if (!memberAddress || !projectOwnerAddress) {
      setStatusMessage('Please enter both member and project owner addresses.');
      return;
    }
    
    setStatusMessage('Checking membership...');
    try {
      const result = await checkIsMember(memberAddress, projectOwnerAddress);
      setIsMember(result);
      setStatusMessage(result 
        ? 'Membership verified ✅' 
        : 'Not a member of this project ❌');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  if (!connected) {
    return (
      <div className="p-4 border rounded-lg max-w-2xl mx-auto my-8 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Solana Permission Program</h2>
        <p className="text-red-500">Please connect your wallet to use this component.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg max-w-2xl mx-auto my-8 bg-gray-50">
      <h2 className="text-xl font-bold mb-4">Solana Permission Program</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          <div className="font-bold">Error:</div>
          <div className="text-sm">{error}</div>
          {error.includes("Provider local is not available") && (
            <div className="mt-2 text-sm">
              <strong>Solution:</strong> Make sure your wallet is connected. The Anchor Provider needs a connected wallet to work in the browser.
            </div>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-semibold">Connected Wallet:</p>
        <p className="text-sm font-mono break-all">{publicKey?.toString()}</p>
      </div>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          onClick={handleInitializeProject}
          disabled={!initialized || loading}
        >
          Initialize Project
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Member Address:</label>
        <input 
          type="text" 
          value={memberAddress}
          onChange={(e) => setMemberAddress(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter a Solana wallet address"
        />
      </div>
      
      <div className="mb-4 flex space-x-2">
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleAddMember}
          disabled={!initialized || loading || !memberAddress}
        >
          Add Member
        </button>
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={handleRemoveMember}
          disabled={!initialized || loading || !memberAddress}
        >
          Remove Member
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Project Owner Address (for membership check):</label>
        <input 
          type="text" 
          value={projectOwnerAddress}
          onChange={(e) => setProjectOwnerAddress(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter the project owner's wallet address"
        />
      </div>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={handleCheckMembership}
          disabled={!initialized || loading || !memberAddress || !projectOwnerAddress}
        >
          Check Membership
        </button>
      </div>
      
      {loading && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">
          Loading...
        </div>
      )}
      
      {statusMessage && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          {statusMessage}
        </div>
      )}
      
      {isMember !== null && (
        <div className={`mb-4 p-2 rounded ${isMember ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          Membership status: {isMember ? 'Member ✅' : 'Not a member ❌'}
        </div>
      )}
      
      {lastTxId && (
        <div className="mb-4">
          <p className="font-semibold">Last Transaction ID:</p>
          <p className="text-xs font-mono break-all">{lastTxId}</p>
          <a 
            href={`https://explorer.solana.com/tx/${lastTxId}?cluster=devnet`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm"
          >
            View on Solana Explorer
          </a>
        </div>
      )}
    </div>
  );
} 