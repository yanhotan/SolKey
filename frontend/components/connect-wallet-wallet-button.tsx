"use client"

import { useState } from "react"
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

export function ConnectWalletButton() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletType, setWalletType] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleConnect = async (walletType: string) => {
    setIsConnecting(true)
    setWalletType(walletType)
    
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
      setWalletAddress(walletType === "metamask" ? "8xH4...3kPd" : "7pQr...9mZs")
      setIsDialogOpen(false)
    }, 1500)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    setWalletType("")
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {isConnected ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDisconnect}>
            <div
              className={`h-4 w-4 rounded-full ${walletType === "metamask" ? "bg-orange-500" : walletType === "phantom" ? "bg-purple-500" : "bg-solflare-500"}`}
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
            Connect your Solana wallet (Devnet) to manage your subscription and make payments.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={isConnecting}
            onClick={() => handleConnect("phantom")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Phantom</span>
            </div>
            {isConnecting && walletType === "phantom" ? "Connecting..." : "Connect"}
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-between"
            disabled={isConnecting}
            onClick={() => handleConnect("solflare")}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>
              <span>Solflare</span>
            </div>
            {isConnecting && walletType === "solflare" ? "Connecting..." : "Connect"}
          </Button>

          <Button
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
          </Button>

          <Button
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
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  )
}
