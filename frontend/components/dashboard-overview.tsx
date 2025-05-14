"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  Users, 
  Key, 
  GitBranch, 
  Loader, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  LoaderCircle,
  AlertCircle 
} from "lucide-react";
import SecretViewer from "./secret-viewer";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWalletEncryption } from "@/hooks/use-wallet-encryption";

interface Secret {
  id: string;
  name: string;
  type: string;
  projectName: string;
  environmentName: string;
}

interface VerificationData {
  encryptedData: any | null;
  decryptedData: any | null;
  encryptedError: string | null;
  decryptedError: string | null;
  isEncryptedLoading: boolean;
  isDecryptedLoading: boolean;
}

export function DashboardOverview() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<Record<string, VerificationData>>({});
  const { publicKey, connected, signMessage } = useWallet();
  const { isInitialized, handleSignMessage } = useWalletEncryption();

  const stats = [
    {
      title: "Total Projects",
      value: "5",
      description: "2 active this week",
      icon: <FolderKanban className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Environments",
      value: "12",
      description: "Across all projects",
      icon: <GitBranch className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Team Members",
      value: "8",
      description: "3 pending invitations",
      icon: <Users className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "API Keys",
      value: "3",
      description: "Last used 2 hours ago",
      icon: <Key className="h-5 w-5 text-blue-500" />,
    },
  ];

  // Fetch secrets when wallet is connected
  useEffect(() => {
    const fetchSecrets = async () => {
      if (!connected || !publicKey) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const result = await api.secrets.list({
          walletAddress: publicKey.toBase58(),
          signature: '' // Not actually used in our implementation
        });
        
        if (result && result.secrets) {
          setSecrets(result.secrets);
        }
      } catch (err) {
        console.error("Failed to fetch secrets:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch secrets");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSecrets();
  }, [connected, publicKey]);

  // Initialize verification data structure for each secret and auto-fetch encrypted data
  useEffect(() => {
    // Only initialize when there are secrets and wallet is connected
    if (!connected || !publicKey || secrets.length === 0) return;
      
    const newVerificationData: Record<string, VerificationData> = {};
    const secretsToFetch: string[] = [];

    // Initialize verification data for each secret
    for (const secret of secrets) {
      // Skip if we already have data for this secret
      if (verificationData[secret.id] && verificationData[secret.id].encryptedData) continue;
      
      // Initialize data structure
      newVerificationData[secret.id] = {
        encryptedData: null,
        decryptedData: null,
        encryptedError: null,
        decryptedError: null,
        isEncryptedLoading: true, // Set to true for auto-fetching
        isDecryptedLoading: false
      };
      
      // Add to the list of secrets that need fetching
      secretsToFetch.push(secret.id);
    }
    
    // Update verification data first
    if (Object.keys(newVerificationData).length > 0) {
      setVerificationData(prev => ({
        ...prev,
        ...newVerificationData
      }));
      
      // Auto-fetch encrypted data for each secret
      console.log(`Auto-fetching encrypted data for ${secretsToFetch.length} secrets`);
      
      // Create a function to fetch secrets sequentially to avoid overwhelming the API
      const fetchSequentially = async () => {
        for (const secretId of secretsToFetch) {
          console.log(`Auto-fetching encrypted data for secret ${secretId}`);
          const result = await fetchEncryptedData(secretId);
          
          // Update state with the result
          setVerificationData(prev => ({
            ...prev,
            [secretId]: {
              ...prev[secretId],
              encryptedData: result?.data || null,
              encryptedError: result?.error || null,
              isEncryptedLoading: false
            }
          }));
          
          // Add a small delay between requests
          if (secretsToFetch.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };
      
      fetchSequentially().catch(err => {
        console.error("Error in auto-fetch sequence:", err);
      });
    }
  // Remove verificationData from deps to prevent excessive rerendering
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secrets, connected, publicKey]);

  // Handle decryption
  const handleDecrypt = async (secretId: string) => {
    if (!connected || !publicKey || !signMessage) return;

    setVerificationData(prev => ({
      ...prev,
      [secretId]: {
        ...prev[secretId],
        isDecryptedLoading: true,
        decryptedError: null
      }
    }));

    try {
      console.log("===== DECRYPTION PROCESS STARTED =====");
      
      // First ensure encryption key is initialized by signing message if needed
      if (!isInitialized || !localStorage.getItem('solkey:encryption-key')) {
        console.log("Encryption key not found, initializing wallet encryption key before decryption");
        try {
          await handleSignMessage();
          console.log("Encryption key initialization complete, encryption key in localStorage:", 
            !!localStorage.getItem('solkey:encryption-key'));
          // Verify a proper key was stored
          if (!localStorage.getItem('solkey:encryption-key')) {
            throw new Error("Encryption key was not properly stored after signing.");
          }
        } catch (signErr) {
          console.error("Failed to initialize encryption key:", signErr);
          throw new Error("Please sign the message with your wallet to decrypt");
        }
      } else {
        console.log("Using existing encryption key from localStorage");
      }

      // Now sign message for auth
      const message = new TextEncoder().encode("auth-to-decrypt");
      const signature = await signMessage(message);
      const signatureBase64 = Buffer.from(signature).toString("base64");

      console.log(`Sending decrypt request for secret ${secretId}`);
      const decryptedResult = await api.secrets.decrypt(secretId, {
        walletAddress: publicKey.toBase58(),
        signature: signatureBase64
      });

      console.log("Decryption successful!");
      // Display success message and update state
      console.log("Decryption successful, updating UI with result:", {
        secretId,
        hasResult: !!decryptedResult,
        hasValue: !!decryptedResult?.value,
        valueLength: decryptedResult?.value?.length,
        secretType: decryptedResult?.type
      });
      
      // Log successful decryption details
      console.log("Decryption completed successfully:", {
        secretId,
        name: decryptedResult.name,
        type: decryptedResult.type,
        valueLength: decryptedResult.value?.length || 0
      });
      
      setVerificationData(prev => ({
        ...prev,
        [secretId]: {
          ...prev[secretId],
          decryptedData: decryptedResult,
          decryptedError: null,
          isDecryptedLoading: false
        }
      }));
    } catch (decryptErr) {
      // Improved error handling with more context
      console.error(`Failed to decrypt secret ${secretId}:`, decryptErr);
      
      // Check if we have specific error types we should handle specially
      let errorMessage = "Failed to decrypt secret";
      
      if (decryptErr instanceof Error) {
        errorMessage = decryptErr.message;
        
        if (errorMessage.includes("key")) {
          errorMessage = "Encryption key issue: " + errorMessage;
        } else if (errorMessage.includes("decrypt")) {
          errorMessage = "Decryption failed: " + errorMessage;
        }
      }
      
      setVerificationData(prev => ({
        ...prev,
        [secretId]: {
          ...prev[secretId],
          decryptedError: errorMessage,
          isDecryptedLoading: false
        }
      }));
    }
  };

  // Core function to fetch encrypted data (without state updates)
  const fetchEncryptedData = async (secretId: string) => {
    if (!connected || !publicKey) return null;

    try {
      const encryptedResult = await api.secrets.fetchEncrypted(secretId, {
        walletAddress: publicKey.toBase58(),
        // No signature needed for encrypted data
      });

      console.log(`Fetched encrypted data for secret ${secretId}:`, encryptedResult);
      
      // Add more detailed logging for automatic fetching
      const source = new Error().stack?.includes('fetchSequentially') ? 'auto' : 'manual';
      console.log(`Data fetch completed (${source}) for secret ${secretId}`);
      
      return {
        data: encryptedResult,
        error: null
      };
    } catch (err) {
      console.error(`Failed to fetch encrypted data for secret ${secretId}:`, err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to fetch encrypted data"
      };
    }
  };
  
  // Handle fetching encrypted data (with state updates - for UI button)
  const handleFetchEncrypted = async (secretId: string) => {
    if (!connected || !publicKey) return;

    setVerificationData(prev => ({
      ...prev,
      [secretId]: {
        ...prev[secretId],
        isEncryptedLoading: true,
        encryptedError: null
      }
    }));

    const result = await fetchEncryptedData(secretId);

    setVerificationData(prev => ({
      ...prev,
      [secretId]: {
        ...prev[secretId],
        encryptedData: result?.data || null,
        encryptedError: result?.error || null,
        isEncryptedLoading: false
      }
    }));
  };

  // Render verification results with detailed information
  const renderVerificationResults = (secret: Secret) => {
    const data = verificationData[secret.id];
    if (!data) return null;
    
    // Check if we need to show encryption key initialization status
    const needsEncryptionKey = !localStorage.getItem('solkey:encryption-key');
    
    return (
      <Card key={secret.id} className="col-span-full mt-4">
        {needsEncryptionKey && (
          <div className="bg-amber-50 border-amber-200 border px-4 py-2 text-amber-800 text-sm">
            <span className="font-semibold">Wallet encryption key required:</span> Please click "Sign & Decrypt" to initialize the encryption key before decrypting your data.
          </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Secret Verification: {secret.name}</CardTitle>
            <div className="flex space-x-4 items-center">
              <div className="flex items-center">
                <span className="mr-2">Encrypted:</span>
                {data.isEncryptedLoading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-blue-500" />
                ) : data.encryptedData ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center">
                <span className="mr-2">Decrypted:</span>
                {data.isDecryptedLoading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-blue-500" />
                ) : data.decryptedData ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <Button 
                variant="outline"
                disabled={data.isEncryptedLoading}
                onClick={() => handleFetchEncrypted(secret.id)}
                className="ml-4"
              >
                {data.encryptedData ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </>
                ) : (
                  <>
                    <LoaderCircle className={`h-4 w-4 mr-2 ${data.isEncryptedLoading ? 'animate-spin' : ''}`} />
                    {data.isEncryptedLoading ? 'Loading...' : 'Fetch Encrypted'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                disabled={!data.encryptedData || data.isDecryptedLoading}
                onClick={() => handleDecrypt(secret.id)}
                className="ml-4"
              >
                <Key className="h-4 w-4 mr-2" />
                {data.isDecryptedLoading ? "Decrypting..." : isInitialized ? "Decrypt Data" : "Sign & Decrypt"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Encrypted Data</h3>
              {data.encryptedError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{data.encryptedError}</AlertDescription>
                </Alert>
              ) : data.isEncryptedLoading ? (
                <div className="flex items-center">
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading encrypted data automatically...</span>
                </div>
              ) : (
                <div className="max-h-96 overflow-auto bg-muted p-2 rounded-md">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(data.encryptedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Decrypted Data</h3>
              {data.decryptedError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{data.decryptedError}</AlertDescription>
                </Alert>
              ) : data.isDecryptedLoading ? (
                <div className="flex items-center">
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading decrypted data...</span>
                </div>
              ) : data.encryptedData && !data.decryptedData && !isInitialized ? (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Wallet Authentication Required</AlertTitle>
                  <AlertDescription>
                    Click "Sign & Decrypt" to authenticate with your wallet and decrypt this data.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="max-h-96 overflow-auto bg-muted p-2 rounded-md">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(data.decryptedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Verification Result</h3>
            {data.isEncryptedLoading || data.isDecryptedLoading ? (
              <div className="flex items-center">
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                <span>Verification in progress...</span>
              </div>
            ) : data.encryptedError || data.decryptedError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>
                  {data.encryptedError || data.decryptedError}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Verification Successful</AlertTitle>
                <AlertDescription>
                  Both encrypted and decrypted data fetched successfully. 
                  Decrypted value: <span className="font-mono">{data.decryptedData?.value}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
      
      {error && (
        <Alert variant="destructive" className="col-span-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center p-6">
            <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2">Loading secrets...</p>
          </CardContent>
        </Card>
      ) : secrets.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {connected ? "No secrets found for your wallet. Add a secret to get started." : "Connect your wallet to view your secrets."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {secrets.map(secret => renderVerificationResults(secret))}
        </>
      )}
    </>
  );
}
