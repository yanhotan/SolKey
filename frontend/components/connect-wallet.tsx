"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Check, AlertCircle, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import { hasEncryptionKey } from "@/lib/crypto"

export function ConnectWallet() {
  const { connected, connecting, disconnect, publicKey, wallet } = useWallet()
  const { handleSignMessage, error: encryptionError, isInitialized } = useWalletEncryption()
  const [activeTab, setActiveTab] = useState("connect")
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle wallet signature for encryption
  const handleInitializeEncryption = async () => {
    if (!connected) return

    setIsSigning(true)
    setError(null)

    try {
      await handleSignMessage()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message")
    } finally {
      setIsSigning(false)
    }
  }

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setActiveTab("connect")
    }
  }, [connected])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Connection</CardTitle>
        <CardDescription>
          Connect your Solana wallet to manage your subscription and encrypt your secrets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Wallet Connected</AlertTitle>
              <AlertDescription>
                Your wallet is connected to Solana Devnet and ready for payments and encryption.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div>{wallet?.adapter.name}</div>
                    <p className="text-sm font-mono text-muted-foreground">
                      {publicKey?.toBase58()}
                    </p>
                  </div>
                </div>
              </div>

              {!isInitialized && (
                <div className="mt-4 pt-4 border-t">
                  <Alert className="bg-yellow-50 dark:bg-yellow-950/30">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle>Encryption Key Required</AlertTitle>
                    <AlertDescription>
                      Sign a message with your wallet to generate your encryption key for secure access to your secrets.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleInitializeEncryption}
                    disabled={isSigning}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {isSigning ? "Signing..." : "Sign Message for Encryption"}
                  </Button>

                  {(error || encryptionError) && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error || encryptionError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {isInitialized && (
                <div className="mt-4 pt-4 border-t">
                  <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Encryption Ready</AlertTitle>
                    <AlertDescription>
                      Your wallet-derived encryption key is active. You can now securely encrypt and decrypt your secrets.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Button
                variant="outline"
                onClick={disconnect}
                className="w-full mt-4"
              >
                Disconnect Wallet
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connect">Connection</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="connect" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Connection Status</div>
                    <div className="text-sm text-muted-foreground">Connected to Solana Devnet</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  >
                    Active
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="font-medium">Network</div>
                  <div className="flex items-center justify-between rounded border p-3">
                    <div className="text-sm">Solana Devnet</div>
                    <Badge>Current</Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Connect your Solana wallet to access premium features, manage your subscription, and encrypt your
                secrets.
              </AlertDescription>
            </Alert>

            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>
                By connecting your wallet, you agree to our Terms of Service and Privacy Policy. Your wallet is used for
                both payments and secure encryption of your secrets.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
