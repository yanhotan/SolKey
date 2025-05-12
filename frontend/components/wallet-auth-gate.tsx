"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield, Check } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import { ConnectWalletButton } from "@/components/connect-wallet-button"

interface WalletAuthGateProps {
  children: React.ReactNode
}

export function WalletAuthGate({ children }: WalletAuthGateProps) {
  const { connected } = useWallet()
  const { isInitialized, handleSignMessage, error } = useWalletEncryption()
  const [initializationError, setInitializationError] = useState<string | null>(null)

  useEffect(() => {
    if (connected && !isInitialized) {
      handleSignMessage().catch((err: unknown) => {
        console.error('Failed to initialize encryption:', err)
        setInitializationError(err instanceof Error ? err.message : 'Failed to initialize encryption')
      })
    }
  }, [connected, isInitialized, handleSignMessage])

  if (!connected) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Initializing Encryption...</h1>
        {(error || initializationError) && (
          <p className="text-red-500 mb-4">{error || initializationError}</p>
        )}
        <p>Please sign the message in your wallet to continue.</p>
      </div>
    )
  }

  return <>{children}</>
}
