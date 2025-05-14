"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Card, Typography, Alert, Space } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, KeyOutlined, CodeOutlined, LoadingOutlined, InfoCircleOutlined, LockOutlined } from "@ant-design/icons";
import { api } from "../lib/api";

const { Text, Paragraph } = Typography;

interface SecretViewerProps {
  secretId: string;
  secretName: string;
  type: string;
}

// Define the structure that matches the backend response
interface SecretMetadata {
  id: string;
  name: string;
  type: string;
  projectName?: string;
  environmentName?: string;
}

// This interface directly matches what the API client returns
interface FlattenedEncryptedData {
  // Secret info
  id: string;
  name: string;
  type: string;
  
  // Secret encrypted data
  encrypted_value: string;
  iv: string;
  auth_tag: string;
  
  // Key info
  encrypted_aes_key: string;
  nonce: string;
  ephemeral_public_key: string;
}

// This interface matches what we need in the frontend
interface EncryptedSecret {
  secret: {
    id: string;
    name: string;
    encrypted_value: string;
    iv: string;
    auth_tag: string;
    type: string;
  };
  aesKeyInfo: {
    encrypted_aes_key: string;
    nonce: string;
    ephemeral_public_key: string;
  };
}

export default function SecretViewer({
  secretId,
  secretName,
  type,
}: SecretViewerProps) {
  const [secretData, setSecretData] = useState<{ name: string; value: string } | null>(null);
  const [encryptedData, setEncryptedData] = useState<EncryptedSecret | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEncrypted, setIsFetchingEncrypted] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<any | null>(null);
  const [walletStatus, setWalletStatus] = useState<string>('');
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [signatureInProgress, setSignatureInProgress] = useState<boolean>(false);
  const { publicKey, signMessage, connected } = useWallet();

  // Check wallet connection status
  useEffect(() => {
    if (!connected) {
      setWalletStatus('Not connected. Please connect your wallet first.');
    } else if (!publicKey) {
      setWalletStatus('Wallet connected but public key not available.');
    } else if (!signMessage) {
      setWalletStatus('Wallet connected but signing is not available.');
    } else {
      setWalletStatus(`Connected: ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`);
    }
  }, [connected, publicKey, signMessage]);

  // Fetch metadata without requiring signature when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkAccessWithoutSigning();
      fetchEncryptedDataWithoutSignature();
    }
  }, [connected, publicKey]);

  // Check if the wallet has access without requiring signature
  const checkAccessWithoutSigning = async () => {
    if (!publicKey) return;
    
    try {
      setIsCheckingAccess(true);
      setError(null);
      
      // Just fetch metadata to see if this wallet has access
      // This doesn't require a signature
      const response = await api.secrets.listMetadata(publicKey.toBase58());
      
      // Check if this secretId is in the list
      const hasAccess = response.secrets?.some((secret: SecretMetadata) => secret.id === secretId) || false;
      
      setHasAccess(hasAccess);
      setAccessStatus(hasAccess 
        ? "You have access to this secret. Click Decrypt to view it." 
        : "Your wallet doesn't have access to this secret.");
      
      return hasAccess;
    } catch (err) {
      console.error("Access check failed:", err);
      setAccessStatus("Failed to verify access to this secret");
      return false;
    } finally {
      setIsCheckingAccess(false);
    }
  };

  // Fetch encrypted data without requiring signature
  const fetchEncryptedDataWithoutSignature = async () => {
    if (!publicKey) return;
    
    try {
      setIsFetchingEncrypted(true);
      setError(null);
      
      // Fetch metadata to check access
      const response = await api.secrets.listMetadata(publicKey.toBase58());
      
      // Check if this secretId is in the list
      const hasAccess = response.secrets?.some((secret: SecretMetadata) => secret.id === secretId) || false;
      
      if (!hasAccess) {
        console.log("User doesn't have access to this secret");
        return;
      }
      

      setHasAccess(true);
    } catch (err) {
      console.error("Fetching encrypted data without signature failed:", err);
    } finally {
      setIsFetchingEncrypted(false);
    }
  };

  // Fetch the encrypted data without signature
  const fetchEncryptedData = async () => {
    if (!publicKey) {
      setError("Wallet not connected");
      return;
    }

    try {
      setIsFetchingEncrypted(true);
      setError(null);
      setDetailedError(null);
      
      // Fetch the encrypted data - no signature required
      console.log("Fetching encrypted data for secret:", { 
        secretId, 
        walletAddress: publicKey.toBase58()
      });
      
      const fetchedData = await api.secrets.fetchEncrypted(secretId, {
        walletAddress: publicKey.toBase58()
        // No signature required for fetching encrypted data
      }) as FlattenedEncryptedData;

      console.log("Encrypted data fetched successfully");
      
      // Convert the flattened data to the structured format we use in the component
      const structuredData: EncryptedSecret = {
        secret: {
          id: fetchedData.id,
          name: fetchedData.name,
          type: fetchedData.type,
          encrypted_value: fetchedData.encrypted_value,
          iv: fetchedData.iv,
          auth_tag: fetchedData.auth_tag
        },
        aesKeyInfo: {
          encrypted_aes_key: fetchedData.encrypted_aes_key,
          nonce: fetchedData.nonce,
          ephemeral_public_key: fetchedData.ephemeral_public_key
        }
      };
      
      setEncryptedData(structuredData);
    } catch (err) {
      console.error("Operation failed:", err);
      const errorMsg = err instanceof Error ? err.message : "Operation failed";
      setError(errorMsg);
      setDetailedError(err);
    } finally {
      setIsFetchingEncrypted(false);
    }
  };

  // Decrypt the data
  const decryptSecret = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected or signing not available");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      
      // Prevent multiple concurrent signing operations
      if (signatureInProgress) {
        console.log("Signature already in progress, please wait");
        return;
      }
      
      setSignatureInProgress(true);

      // First check if we need to fetch the encrypted data
      if (!encryptedData) {
        // We need to fetch encrypted data first
        await fetchEncryptedData();
        if (!encryptedData) {
          throw new Error("Failed to fetch encrypted data");
        }
      }
      
      // Check if encryption key exists in localStorage
      const hasEncryptionKey = !!localStorage.getItem('solkey:encryption-key');
      if (!hasEncryptionKey) {
        console.log("Encryption key not found, initializing wallet encryption key before decryption");
        try {
          // First sign a message to derive the encryption key
          const { SIGNATURE_MESSAGE } = await import("@/lib/wallet-auth");
          const messageBytes = new TextEncoder().encode(SIGNATURE_MESSAGE);
          
          // Sign the message with wallet
          console.log("Signing message to derive encryption key");
          const keySignature = await signMessage(messageBytes);
          console.log("Message signed successfully for key derivation");
          
          // Import necessary functions
          const { deriveEncryptionKey } = await import("@/lib/wallet-auth");
          const bs58 = await import('bs58');
          
          // Derive and store the encryption key locally
          await deriveEncryptionKey(
            SIGNATURE_MESSAGE,
            bs58.default.encode(keySignature)
          );
          
          console.log("Encryption key derived and stored successfully");
          
          // Verify the key was stored
          if (!localStorage.getItem('solkey:encryption-key')) {
            throw new Error("Encryption key was not properly stored after signing");
          }
        } catch (keyError) {
          console.error("Failed to derive encryption key:", keyError);
          setError("Failed to set up encryption: " + 
            (keyError instanceof Error ? keyError.message : String(keyError)));
          setSignatureInProgress(false);
          return;
        }
      } else {
        console.log("Using existing encryption key from localStorage");
      }
      
      // Now sign message for auth
      const message = new TextEncoder().encode("auth-to-decrypt");
      let signature;
      try {
        console.log("Signing message for decryption");
        signature = await signMessage(message);
        console.log("Message signed successfully for decryption");
      } catch (signError) {
        console.error("Error signing message for decryption:", signError);
        if (signError instanceof Error && signError.message.includes('User rejected')) {
          setError("You cancelled the signature request. The secret could not be decrypted.");
        } else {
          setError(`Failed to sign the message with your wallet: ${signError}`);
        }
        setDetailedError(signError);
        setSignatureInProgress(false);
        return;
      } finally {
        setSignatureInProgress(false);
      }
      
      const signatureBase64 = Buffer.from(signature).toString("base64");
      
      // Now decrypt
      console.log("Decrypting secret:", { secretId });
      const data = await api.secrets.decrypt(secretId, {
        walletAddress: publicKey.toBase58(),
        signature: signatureBase64,
      });

      console.log("Secret decrypted successfully");

      setSecretData({
        name: data.name,
        value: data.value
      });
    } catch (err) {
      console.error("Decryption failed:", err);
      const errorMsg = err instanceof Error ? err.message : "Decryption failed";
      setError(errorMsg);
      
      // Add specific guidance for common errors
      if (errorMsg.includes("multiple (or no) rows returned")) {
        setError("No access key found for your wallet. You need to be added as a project member to access this secret.");
      } else if (errorMsg.includes("Unauthorized")) {
        setError("Your wallet is not authorized to access this secret.");
      } else if (errorMsg.includes("Encryption key not available")) {
        setError("Authentication required. Please try decrypting again to sign with your wallet.");
      }
      
      setDetailedError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={secretName} style={{ marginBottom: 16 }}>
      {error && (
        <Alert
          message="Error"
          description={
            <div>
              <div>{error}</div>
              {detailedError && (
                <details>
                  <summary>Technical Details</summary>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px" }}>
                    {JSON.stringify(detailedError, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ marginBottom: 8 }}>
          <Text type={connected ? "success" : "danger"}>
            Wallet Status: {walletStatus}
          </Text>
        </div>
        
        {accessStatus && !error && (
          <Alert
            message="Secret Access Status"
            description={accessStatus}
            type={hasAccess ? "success" : "warning"}
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}
        
        {isCheckingAccess && (
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <LoadingOutlined style={{ fontSize: 24 }} spin />
            <p>Checking secret access...</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {secretData ? (
            // Secret is decrypted - show the value with a hide button
            <>
              <Text code style={{ flex: 1 }}>
                {secretData.value}
              </Text>
              <Button
                icon={<EyeInvisibleOutlined />}
                onClick={() => setSecretData(null)}
              >
                Hide
              </Button>
            </>
          ) : encryptedData ? (
            // Encrypted data is loaded - show decrypt button
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={decryptSecret}
              loading={isLoading}
              disabled={!connected || !publicKey || !signMessage || signatureInProgress}
              style={{ backgroundColor: "#1890ff" }}
            >
              Decrypt Secret
            </Button>
          ) : hasAccess ? (
            // User has access but data not loaded yet - show fetch button
            <Button
              icon={<CodeOutlined />}
              onClick={fetchEncryptedData}
              loading={isFetchingEncrypted}
              disabled={!connected || !publicKey || !signMessage || signatureInProgress}
            >
              Fetch Encrypted Data
            </Button>
          ) : (
            // User doesn't have confirmed access yet
            <Button
              icon={<LockOutlined />}
              disabled={!connected || !publicKey}
            >
              No Access to Secret
            </Button>
          )}
        </div>

        <Text type="secondary">
          Type: {type}
        </Text>
        
        {secretData && (
          <Text type="secondary">
            Secret Name: {secretData.name}
          </Text>
        )}

        {encryptedData && !secretData && (
          <div style={{ marginTop: 8 }}>
            <Paragraph>
              <Text strong>Encrypted Data:</Text>
            </Paragraph>
            <div style={{ background: "#f5f5f5", padding: 8, borderRadius: 4, maxHeight: 400, overflow: "auto" }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>Two-Layer Encryption System:</Text>
              
              <div style={{ marginBottom: 16 }}>
                <Text strong>Layer 1: Asymmetric Encryption (NaCl box)</Text>
                <div style={{ marginLeft: 16, marginBottom: 8 }}>
                  <Text>The AES key is encrypted with your wallet's public key:</Text>
                  <ul style={{ marginLeft: 16, marginTop: 4 }}>
                    <li><Text code>encrypted_aes_key: </Text><Text code>{encryptedData.aesKeyInfo.encrypted_aes_key.substring(0, 20)}...</Text></li>
                    <li><Text code>nonce: </Text><Text code>{encryptedData.aesKeyInfo.nonce}</Text></li>
                    <li><Text code>ephemeral_public_key: </Text><Text code>{encryptedData.aesKeyInfo.ephemeral_public_key.substring(0, 20)}...</Text></li>
                  </ul>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    This layer uses your wallet's private key to decrypt the AES key. Only your wallet can decrypt this.
                  </Text>
                </div>
              </div>
              
              <div>
                <Text strong>Layer 2: Symmetric Encryption (AES-GCM)</Text>
                <div style={{ marginLeft: 16 }}>
                  <Text>The actual secret data is encrypted with the AES key:</Text>
                  <ul style={{ marginLeft: 16, marginTop: 4 }}>
                    <li><Text code>encrypted_value: </Text><Text code>{encryptedData.secret.encrypted_value.substring(0, 20)}...</Text></li>
                    <li><Text code>iv: </Text><Text code>{encryptedData.secret.iv}</Text></li>
                    <li><Text code>auth_tag: </Text><Text code>{encryptedData.secret.auth_tag}</Text></li>
                  </ul>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Once the AES key is decrypted using your wallet's private key in Layer 1, it's then used to decrypt this data.
                  </Text>
                </div>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <details>
                  <summary style={{ cursor: "pointer", fontWeight: "bold" }}>View full raw data</summary>
                  <pre style={{ fontSize: 12, marginTop: 8, whiteSpace: "pre-wrap" }}>
                    {JSON.stringify({
                      secret: {
                        name: encryptedData.secret.name,
                        encrypted_value: encryptedData.secret.encrypted_value,
                        iv: encryptedData.secret.iv,
                        auth_tag: encryptedData.secret.auth_tag,
                      },
                      aes_key_info: {
                        encrypted_aes_key: encryptedData.aesKeyInfo.encrypted_aes_key,
                        nonce: encryptedData.aesKeyInfo.nonce,
                        ephemeral_public_key: encryptedData.aesKeyInfo.ephemeral_public_key
                      }
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
}
