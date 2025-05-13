"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Card, Typography, Alert, Space } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, KeyOutlined, CodeOutlined, LoadingOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { api } from "../lib/api";

const { Text, Paragraph } = Typography;

interface SecretViewerProps {
  secretId: string;
  secretName: string;
  type: string;
}

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

  // Check if the current wallet has access to this secret
  const checkSecretAccess = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected or signing not available");
      return false;
    }

    try {
      setIsCheckingAccess(true);
      setError(null);
      setDetailedError(null);

      // Sign the auth message
      const message = new TextEncoder().encode("auth-to-decrypt");
      let signature;
      try {
        signature = await signMessage(message);
        console.log("Message signed successfully for access check");
      } catch (signError) {
        console.error("Error signing message for access check:", signError);
        setError("Failed to sign the message with your wallet");
        setDetailedError(signError);
        return false;
      }
      
      const signatureBase64 = Buffer.from(signature).toString("base64");

      try {
        // Make an initial fetch attempt to check if we have access
        await api.secrets.fetchEncrypted(secretId, {
          walletAddress: publicKey.toBase58(),
          signature: signatureBase64,
        });
        
        setAccessStatus("You have access to this secret");
        return true;
      } catch (err) {
        console.error("Access check failed:", err);
        if (err instanceof Error && err.message.includes("Unauthorized")) {
          setAccessStatus("Your wallet doesn't have access to this secret. You may need to be added as a project member.");
        } else if (err instanceof Error && err.message.includes("multiple (or no) rows returned")) {
          setAccessStatus("No encryption key found for your wallet. You need to be added as a project member to access this secret.");
        } else {
          setAccessStatus("Failed to verify access to this secret");
        }
        return false;
      }
    } catch (err) {
      console.error("Access check error:", err);
      setAccessStatus("Failed to check access");
      return false;
    } finally {
      setIsCheckingAccess(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey && signMessage) {
      checkSecretAccess();
    }
  }, [connected, publicKey, signMessage]);

  const handleFetchEncrypted = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected or signing not available");
      return;
    }

    try {
      setIsFetchingEncrypted(true);
      setError(null);
      setDetailedError(null);

      // Sign the auth message
      const message = new TextEncoder().encode("auth-to-decrypt");
      let signature;
      try {
        signature = await signMessage(message);
        console.log("Message signed successfully");
      } catch (signError) {
        console.error("Error signing message:", signError);
        setError("Failed to sign the message with your wallet");
        setDetailedError(signError);
        return;
      }
      
      const signatureBase64 = Buffer.from(signature).toString("base64");

      // Fetch the encrypted data
      console.log("Fetching encrypted data for secret:", { 
        secretId, 
        walletAddress: publicKey.toBase58(),
        signatureLength: signatureBase64.length 
      });
      
      const data = await api.secrets.fetchEncrypted(secretId, {
        walletAddress: publicKey.toBase58(),
        signature: signatureBase64,
      });

      console.log("Encrypted data fetched successfully:", {
        secretId,
        dataReceived: !!data,
        dataType: typeof data
      });

      setEncryptedData(data);
    } catch (err) {
      console.error("Fetch encrypted error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch encrypted secret";
      setError(errorMsg);
      
      // Add specific guidance for common errors
      if (errorMsg.includes("multiple (or no) rows returned")) {
        setError("No access key found for your wallet. You need to be added as a project member to access this secret.");
      } else if (errorMsg.includes("Unauthorized")) {
        setError("Your wallet is not authorized to access this secret.");
      }
      
      setDetailedError(err);
    } finally {
      setIsFetchingEncrypted(false);
    }
  };

  const handleDecrypt = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected or signing not available");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDetailedError(null);

      // Sign the auth message
      const message = new TextEncoder().encode("auth-to-decrypt");
      let signature;
      try {
        signature = await signMessage(message);
        console.log("Message signed successfully for decryption");
      } catch (signError) {
        console.error("Error signing message for decryption:", signError);
        setError("Failed to sign the message with your wallet");
        setDetailedError(signError);
        return;
      }
      
      const signatureBase64 = Buffer.from(signature).toString("base64");

      console.log("Decrypting secret:", { 
        secretId, 
        walletAddress: publicKey.toBase58(),
        signatureLength: signatureBase64.length 
      });

      // Get the secret using the API
      const data = await api.secrets.decrypt(secretId, {
        walletAddress: publicKey.toBase58(),
        signature: signatureBase64,
      });

      console.log("Secret decrypted successfully:", {
        secretId,
        name: data.name,
        type: data.type,
        valueLength: data.value ? data.value.length : 0
      });

      setSecretData({
        name: data.name,
        value: data.value
      });
    } catch (err) {
      console.error("Decrypt error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to decrypt secret";
      setError(errorMsg);
      
      // Add specific guidance for common errors
      if (errorMsg.includes("multiple (or no) rows returned")) {
        setError("No access key found for your wallet. You need to be added as a project member to access this secret.");
      } else if (errorMsg.includes("Unauthorized")) {
        setError("Your wallet is not authorized to access this secret.");
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
        
        {accessStatus && (
          <Alert
            message="Secret Access Status"
            description={accessStatus}
            type={accessStatus.includes("have access") ? "success" : "warning"}
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
          ) : (
            <Space>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleDecrypt}
                loading={isLoading}
                disabled={!connected || !publicKey || !signMessage}
              >
                Decrypt Secret
              </Button>
              <Button
                icon={<CodeOutlined />}
                onClick={handleFetchEncrypted}
                loading={isFetchingEncrypted}
                disabled={!connected || !publicKey || !signMessage}
              >
                Fetch Encrypted
              </Button>
            </Space>
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
