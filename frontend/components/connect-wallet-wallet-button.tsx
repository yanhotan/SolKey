"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useWalletEncryption } from "@/hooks/use-wallet-encryption";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { WalletMultiButton, BaseWalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

interface ConnectWalletButtonProps {
  showConnectDialog?: boolean;
}

const LABELS = {
  'change-wallet': 'Change wallet',
  connecting: 'Connecting ...',
  'copy-address': 'Copy address',
  copied: 'Copied',
  disconnect: 'Disconnect',
  'has-wallet': 'Connect',
  'no-wallet': 'Select Wallet',
} as const;

export function ConnectWalletButton({ showConnectDialog = false }: ConnectWalletButtonProps) {
  const [isConnected, setIsConnected] = useState(false);  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { wallets, select, disconnect, connect, publicKey, connected } = useWallet();
  const { isInitialized } = useWalletEncryption();
  const [walletAddress, setWalletAddress] = useState("");
  const [walletType, setWalletType] = useState("");

  // Update isConnected state when wallet state changes
  useEffect(() => {
    setIsConnected(connected && isInitialized);
  }, [connected, isInitialized]);

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnect = async (walletType: "Phantom" | "Solflare" | "") => {
    try {
      setIsConnecting(true);

      const walletAdapter = wallets.find((w) => w.adapter.name === walletType);
      if (!walletAdapter)
        throw new Error(`Wallet adapter for ${walletType} not found`);

      await select(walletAdapter.adapter.name);
      await connect();
      
      // Only close dialog if we're not showing the full dialog UI
      if (!showConnectDialog) {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }

    // Simulate wallet connection
    // setTimeout(() => {
    //   setIsConnecting(false)
    //   setIsConnected(true)
    //   setWalletAddress(walletType === "metamask" ? "8xH4...3kPd" : "7pQr...9mZs")
    //   setIsDialogOpen(false)
    // }, 1500)
  };

  const handleDisconnect = async () => {
    try {
      if (disconnect) {
        // Clear Solana wallet-related data from localStorage
        const clearStorageData = () => {
          const STORAGE_KEY_PREFIX = "solkey";
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (
              key.startsWith(STORAGE_KEY_PREFIX) &&
              !key.startsWith("encrypted:")
            ) {
              localStorage.removeItem(key);
            }
          });
        };
        clearStorageData();

        // Disconnect from the wallet
        await disconnect();
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    } finally {
      // Reset UI state
      setIsConnected(false);
      setWalletAddress("");
      setWalletType("");
    }
  };

  // If showConnectDialog is true, render the original WalletMultiButton
  if (showConnectDialog) {
    return <WalletMultiButton />;
  }

  // Show connected state with all wallet options
  if (isConnected && publicKey) {
    return (
      <BaseWalletMultiButton 
        labels={LABELS}
        className="!bg-transparent hover:!bg-accent !border !border-input !rounded-md !h-7 !px-3 !text-sm !font-medium gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        {shortenAddress(publicKey.toBase58())}
        <Badge variant="outline" className="ml-1 text-xs">
          Devnet
        </Badge>
      </BaseWalletMultiButton>
    );
  }

  // Show connect button
  return (
    <BaseWalletMultiButton 
      labels={LABELS}
      className="!bg-transparent hover:!bg-accent !border !border-input !rounded-md !h-7 !px-3 !text-sm !font-medium gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </BaseWalletMultiButton>
  );
}
