"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, Key, GitBranch, LoaderCircle, CheckCircle2, XCircle } from "lucide-react";
import SecretViewer from "./secret-viewer";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

  // Verify encryption and decryption for each secret
  useEffect(() => {
    const verifySecrets = async () => {
      if (!connected || !publicKey || !signMessage || secrets.length === 0) return;
      
      const newVerificationData: Record<string, VerificationData> = {};

      for (const secret of secrets) {
        // Initialize verification data for this secret
        newVerificationData[secret.id] = {
          encryptedData: null,
          decryptedData: null,
          encryptedError: null,
          decryptedError: null,
          isEncryptedLoading: true,
          isDecryptedLoading: true
        };
        
        setVerificationData(prev => ({
          ...prev,
          [secret.id]: newVerificationData[secret.id]
        }));
        
        // First fetch encrypted data
        try {
          // Sign message for auth
          const message = new TextEncoder().encode("auth-to-decrypt");
          const signature = await signMessage(message);
          const signatureBase64 = Buffer.from(signature).toString("base64");
          
          const encryptedResult = await api.secrets.fetchEncrypted(secret.id, {
            walletAddress: publicKey.toBase58(),
            signature: signatureBase64
          });
          
          newVerificationData[secret.id] = {
            ...newVerificationData[secret.id],
            encryptedData: encryptedResult,
            isEncryptedLoading: false
          };
          
          setVerificationData(prev => ({
            ...prev,
            [secret.id]: {
              ...prev[secret.id],
              encryptedData: encryptedResult,
              isEncryptedLoading: false
            }
          }));
          
          // Now try to decrypt
          try {
            // Sign message for auth (needs a fresh signature)
            const message = new TextEncoder().encode("auth-to-decrypt");
            const signature = await signMessage(message);
            const signatureBase64 = Buffer.from(signature).toString("base64");
            
            const decryptedResult = await api.secrets.decrypt(secret.id, {
              walletAddress: publicKey.toBase58(),
              signature: signatureBase64
            });
            
            setVerificationData(prev => ({
              ...prev,
              [secret.id]: {
                ...prev[secret.id],
                decryptedData: decryptedResult,
                isDecryptedLoading: false
              }
            }));
          } catch (decryptErr) {
            console.error(`Failed to decrypt secret ${secret.id}:`, decryptErr);
            setVerificationData(prev => ({
              ...prev,
              [secret.id]: {
                ...prev[secret.id],
                decryptedError: decryptErr instanceof Error ? decryptErr.message : "Failed to decrypt secret",
                isDecryptedLoading: false
              }
            }));
          }
        } catch (encryptErr) {
          console.error(`Failed to fetch encrypted data for secret ${secret.id}:`, encryptErr);
          setVerificationData(prev => ({
            ...prev,
            [secret.id]: {
              ...prev[secret.id],
              encryptedError: encryptErr instanceof Error ? encryptErr.message : "Failed to fetch encrypted data",
              isEncryptedLoading: false,
              isDecryptedLoading: false,
              decryptedError: "Cannot decrypt without encrypted data"
            }
          }));
        }
      }
    };
    
    verifySecrets();
  }, [secrets, connected, publicKey, signMessage]);

  // Render verification results with detailed information
  const renderVerificationResults = (secret: Secret) => {
    const data = verificationData[secret.id];
    if (!data) return null;
    
    return (
      <Card key={secret.id} className="col-span-full mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Secret Verification: {secret.name}</CardTitle>
            <div className="flex space-x-2">
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
                  <span>Loading encrypted data...</span>
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
