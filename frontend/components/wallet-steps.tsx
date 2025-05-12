"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectWalletButton } from "@/components/connect-wallet-button"

export function WalletSteps() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>Wallet Authentication Required</CardTitle>
          <CardDescription>
            Connect your Solana wallet and sign a message to securely access your encrypted secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <AlertTitle>End-to-End Encryption</AlertTitle>
            <AlertDescription>
              Your encryption key is derived from your wallet signature and never leaves your device. This ensures only you can access your secrets.
            </AlertDescription>
          </Alert>

          {/* Step 1: Connect */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                {connected ? (
                  <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Step 1: Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Solana wallet to continue
                </p>
              </div>
              {!connected && <ConnectWalletButton />}
            </div>
          </div>

          {/* Step 2: Sign */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Step 2: Sign Message</h3>
                <p className="text-sm text-muted-foreground">
                  Sign a message to derive your encryption key
                </p>
              </div>
              {connected && (
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  disabled={!connected}
                >
                  Sign
                </Button>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Your wallet is used to securely encrypt and decrypt your secrets. We never have access to your unencrypted data.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
