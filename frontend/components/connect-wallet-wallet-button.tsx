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

interface ConnectWalletButtonProps {
  showConnectDialog?: boolean;
}

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

    // Only show dialog when explicitly requested via prop
  if (!showConnectDialog) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleConnect("Phantom")}>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }
  // If dialog is not requested, show simple connect button
  if (!showConnectDialog) {
    return isConnected ? (
      <Button variant="outline" size="sm" className="gap-2" onClick={handleDisconnect}>
        <div className={`h-4 w-4 rounded-full ${walletType === "Phantom" ? "bg-purple-500" : "bg-orange-500"}`}></div>
        {walletAddress}
        <Badge variant="outline" className="ml-1 text-xs">
          Devnet
        </Badge>
      </Button>
    ) : (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleConnect("Phantom")}>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // Show full dialog UI when requested
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleDisconnect}
          >
            <div
              className={`h-4 w-4 rounded-full ${
                walletType === "metamask"
                  ? "bg-orange-500"
                  : walletType === "phantom"
                  ? "bg-purple-500"
                  : "bg-solflare-500"
              }`}
            ></div>
            {walletAddress}
            <Badge variant="outline" className="ml-1 text-xs">
              Devnet
            </Badge>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            {isConnected ? walletAddress : "Connect Wallet"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Connect your Solana wallet to manage your subscription and
            make payments.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={isConnecting}
            onClick={() => handleConnect("Phantom")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Phantom</span>
            </div>
            {isConnecting && walletType === "phantom"
              ? "Connecting..."
              : "Connect"}
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={isConnecting}
            onClick={() => handleConnect("Solflare")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Solflare</span>
            </div>
            {isConnecting && walletType === "solflare"
              ? "Connecting..."
              : "Connect"}
          </Button>

          {/* <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={isConnecting}
            onClick={() => handleConnect("metamask")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-400 flex items-center justify-center">
                <svg viewBox="0 0 35 33" className="h-3 w-3 text-white">
                  <path
                    d="M32.9582 1L19.8241 10.8252L22.5352 5.08269L32.9582 1Z"
                    fill="#E2761B"
                    stroke="#E2761B"
                    strokeWidth="0.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.04834 1L15.0756 10.9385L12.5034 5.08269L2.04834 1Z"
                    fill="#E4761B"
                    stroke="#E4761B"
                    strokeWidth="0.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28.2031 23.5L24.7195 28.8138L32.2173 30.8561L34.3383 23.6529L28.2031 23.5Z"
                    fill="#E4761B"
                    stroke="#E4761B"
                    strokeWidth="0.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0.686279 23.6529L2.78293 30.8561L10.2807 28.8138L6.79716 23.5L0.686279 23.6529Z"
                    fill="#E4761B"
                    stroke="#E4761B"
                    strokeWidth="0.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>MetaMask (Solana)</span>
              <Badge variant="outline" className="ml-1">
                Beta
              </Badge>
            </div>
            {isConnecting && walletType === "metamask" ? "Connecting..." : "Connect"}
          </Button> */}

          {/* <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={isConnecting}
            onClick={() => handleConnect("backpack")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Backpack</span>
            </div>
            {isConnecting && walletType === "backpack" ? "Connecting..." : "Connect"}
          </Button> */}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          By connecting your wallet, you agree to our Terms of Service and
          Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}
