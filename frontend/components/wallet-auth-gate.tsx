"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Wallet, AlertCircle, Shield, Check } from "lucide-react"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"

interface WalletAuthGateProps {
  children: React.ReactNode
}

export function WalletAuthGate({ children }: WalletAuthGateProps) {
  const { connected } = useWallet();
  const { isInitialized, handleSignMessage, error } = useWalletEncryption();

  useEffect(() => {
    if (connected && !isInitialized) {
      handleSignMessage().catch(console.error);
    }
  }, [connected, isInitialized, handleSignMessage]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <WalletMultiButton />
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Initializing Encryption...</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p>Please sign the message in your wallet to continue.</p>
      </div>
    );
  }

  return <>{children}</>;
}
