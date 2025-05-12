"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useRouter } from "next/navigation"
import { useWalletAuthSkip } from "@/hooks/use-wallet-auth-skip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield, Check, Wallet, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import "@solana/wallet-adapter-react-ui/styles.css"

interface WalletAuthGateProps {
  children: React.ReactNode
}

export function WalletAuthGate({ children }: WalletAuthGateProps) {
  const wallet = useWallet()
  const { connected } = wallet
  const { isInitialized, handleSignMessage, error } = useWalletEncryption()
  const [initializationError, setInitializationError] = useState<string | null>(null)  
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)
  const router = useRouter()  // Clear any initialization errors when wallet connection state changes
  useEffect(() => {
    if (connected) {
      setInitializationError(null)
    }
  }, [connected])

  const signMessage = async () => {
    try {
      setIsSigning(true)
      await handleSignMessage()
    } catch (err) {
      console.error('Failed to sign message:', err)
      // Handle user rejection vs other errors
      const errorMessage = err instanceof Error
        ? err.message.includes('User rejected') 
          ? 'Message signing was cancelled'
          : 'Failed to sign message. Please try again.'
        : 'Failed to sign message. Please try again.'
      setInitializationError(errorMessage)
    } finally {
      setIsSigning(false)
    }
  }
  const skipAuthentication = () => {
    setHasSkipped(true)
    router.push('/dashboard')
  }

  // If already initialized or user has skipped, show children
  if (isInitialized || hasSkipped) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <Card className="w-full max-w-md border-purple-200/50 dark:border-purple-800/30 shadow-lg shadow-purple-500/10">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-t-lg border-b border-purple-100 dark:border-purple-800/20">
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Wallet Authentication
          </CardTitle>
          <CardDescription>
            Connect your Solana wallet and sign a message to securely access your encrypted secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert className="bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 shadow-sm">
            <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <AlertTitle>End-to-End Encryption</AlertTitle>
            <AlertDescription>
              Your encryption key is derived from your wallet signature and never leaves your device. This ensures only
              you can access your secrets.
            </AlertDescription>
          </Alert>

          {(error || initializationError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || initializationError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-purple-100 dark:border-purple-800/30 p-4 bg-white/50 dark:bg-purple-950/20 shadow-sm transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700/40">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-inner shadow-white/20">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Step 1: Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">Connect your Solana wallet to continue</p>
              </div>
              {connected ? (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/30">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
                </div>              ) : (
                <WalletMultiButton 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 !h-9 px-4"
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-purple-100 dark:border-purple-800/30 p-4 bg-white/50 dark:bg-purple-950/20 shadow-sm transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700/40">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-inner shadow-white/20">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Step 2: Sign Message</h3>
                <p className="text-sm text-muted-foreground">Sign a message to derive your encryption key</p>
              </div>
              {isInitialized ? (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/30">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Signed</span>
                </div>
              ) : (
                <Button
                  onClick={signMessage}
                  disabled={!connected || isSigning}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {isSigning ? "Signing..." : "Sign"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-purple-100 dark:border-purple-800/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-b-lg pt-4">
          <p className="text-center text-sm text-muted-foreground">
            Your wallet is used to securely encrypt and decrypt your secrets. We never have access to your unencrypted
            data.
          </p>

          <div className="w-full flex flex-col items-center">
            <Button
              variant="outline"
              onClick={skipAuthentication}
              className="w-full max-w-xs border-dashed border-purple-200 dark:border-purple-800/40 text-muted-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20 group"
            >
              <Eye className="h-4 w-4 mr-2 text-purple-400 group-hover:text-purple-600 dark:text-purple-500 dark:group-hover:text-purple-400" />
              Skip and preview app
            </Button>
            <p className="mt-2 text-xs text-center text-muted-foreground px-6">
              Some features will be limited without wallet authentication
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )

  return <>{children}</>
}
