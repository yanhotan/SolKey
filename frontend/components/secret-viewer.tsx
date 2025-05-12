"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Card, Typography, Alert } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { api } from "../lib/api";
import { useWalletEncryption } from "../hooks/use-wallet-encryption";

const { Text } = Typography;

interface SecretViewerProps {
  secretId: string;
  secretName: string;
  type: string;
}

export default function SecretViewer({
  secretId,
  secretName,
  type,
}: SecretViewerProps) {
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signMessage } = useWallet();
  const { handleSignMessage } = useWalletEncryption();

  const handleDecrypt = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Sign the auth message
      const message = new TextEncoder().encode("auth-to-decrypt");
      const signature = await signMessage(message);
      console.log("Generated signature:", {
        signatureLength: signature.length,
        signatureBase64: Buffer.from(signature).toString("base64"),
      });

      // Get the secret using the API configuration
      const data = await api.secrets.decrypt(secretId, {
        walletAddress: publicKey.toBase58(),
        signature: Buffer.from(signature).toString("base64"),
      });

      setDecryptedValue(data.value);
    } catch (err) {
      console.error("Decrypt error:", err);
      setError(err instanceof Error ? err.message : "Failed to decrypt secret");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title={secretName} style={{ marginBottom: 16 }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {decryptedValue ? (
          <>
            <Text code style={{ flex: 1 }}>
              {decryptedValue}
            </Text>
            <Button
              icon={<EyeInvisibleOutlined />}
              onClick={() => setDecryptedValue(null)}
            >
              Hide
            </Button>
          </>
        ) : (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={handleDecrypt}
            loading={isLoading}
          >
            Show Secret
          </Button>
        )}
      </div>

      <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
        Type: {type}
      </Text>
    </Card>
  );
}
