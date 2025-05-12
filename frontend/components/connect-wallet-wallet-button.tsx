"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { shortenAddress } from "@/lib/utils"
import { WalletName } from "@solana/wallet-adapter-base"
import "@solana/wallet-adapter-react-ui/styles.css"

interface ConnectWalletButtonProps {
  showConnectDialog?: boolean;
}

export function ConnectWalletButton({ showConnectDialog = false }: ConnectWalletButtonProps) {
  const { connected, disconnect, publicKey, select, wallet, connecting } = useWallet()

  const handleConnect = async (walletName: "Phantom" | "Solflare") => {
    try {
      await select(walletName as WalletName)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (disconnect) {
        const clearStorageData = () => {
          const STORAGE_KEY_PREFIX = 'solkey';
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX) && !key.startsWith('encrypted:')) {
              localStorage.removeItem(key);
            }
          });
        };
        clearStorageData();
        await disconnect();
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  if (connected && publicKey) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2" 
        onClick={handleDisconnect}
      >
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        {shortenAddress(publicKey.toBase58())}
        <Badge variant="outline" className="ml-1 text-xs">
          Devnet
        </Badge>
      </Button>
    )
  }

  // Only show dialog when explicitly requested via prop
  if (!showConnectDialog) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleConnect("Phantom")}>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Connect your Solana wallet to manage your secrets and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={connecting}
            onClick={() => handleConnect("Phantom")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Phantom</span>
            </div>
            {connecting ? "Connecting..." : "Connect"}
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={connecting}
            onClick={() => handleConnect("Solflare")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Solflare</span>
            </div>
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  )
}
