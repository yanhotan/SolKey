"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import "@solana/wallet-adapter-react-ui/styles.css"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WalletName } from "@solana/wallet-adapter-base"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"

export function ConnectWalletButton() {
  const { connected, disconnect, publicKey, select, wallet } = useWallet()
  const [showDialog, setShowDialog] = useState(false)
  
  // Function to shorten the wallet address
  const shortenAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  const [error, setError] = useState<string | null>(null)

  // Type-safe wallet selection
  const connectWallet = async (name: "Phantom" | "Solflare") => {
    setError(null)
    try {
      await select(name as WalletName)
      setShowDialog(false)
    } catch (err) {
      console.error("Failed to connect wallet:", err)
      const errorMessage = err instanceof Error
        ? err.message.includes('User rejected') 
          ? 'Wallet connection was cancelled'
          : 'Failed to connect wallet. Please try again.'
        : 'Failed to connect wallet. Please try again.'
      setError(errorMessage)
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
        setShowDialog(false)
        setError(null)
      }
    } catch (err) {
      console.error("Failed to disconnect wallet:", err)
      const errorMessage = err instanceof Error
        ? 'Failed to disconnect wallet: ' + err.message
        : 'Failed to disconnect wallet. Please try again.'
      setError(errorMessage)
    }
  }

  // If connected, show disconnect button outside of Dialog
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

  // When not connected, show simple connect button that opens dialog when clicked
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-between"
            onClick={() => connectWallet("Phantom")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Phantom</span>
            </div>
            <span>Connect</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-between"
            onClick={() => connectWallet("Solflare")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Solflare</span>
            </div>
            <span>Connect</span>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  )
}
