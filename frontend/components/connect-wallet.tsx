"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Check, AlertCircle, ExternalLink, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { hasEncryptionKey, deriveEncryptionKey, clearEncryptionKey, type WalletAdapter } from "@/lib/wallet-auth"

// Mock wallet adapter for demo purposes
const mockWalletAdapter: WalletAdapter = {
  publicKey: null,
  connected: false,
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    // This is just a mock implementation
    return new Uint8Array(32) // Return dummy signature
  },
}

export function ConnectWallet() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletType, setWalletType] = useState("")
  const [solBalance, setSolBalance] = useState("0.00")
  const [activeTab, setActiveTab] = useState("connect")
  const [hasKey, setHasKey] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if encryption key is available
  useEffect(() => {
    setHasKey(hasEncryptionKey())
  }, [])

  const handleConnect = async (type: string) => {
    setIsConnecting(true)
    setWalletType(type)
    setError(null)

    // Simulate wallet connection
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
      setWalletAddress(type === "metamask" ? "8xH4...3kPd" : "7pQr...9mZs")
      setSolBalance(type === "metamask" ? "1.25" : "3.75")
    }, 1500)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    setWalletType("")
    setSolBalance("0.00")
    setActiveTab("connect")
    clearEncryptionKey()
    setHasKey(false)
  }

  const handleSignMessage = async () => {
    if (!isConnected) return

    setIsSigning(true)
    setError(null)

    try {
      // Create a connected mock wallet for demo
      const connectedWallet = {
        ...mockWalletAdapter,
        publicKey: walletAddress,
        connected: true,
      }

      // Derive encryption key from signature
      await deriveEncryptionKey(connectedWallet)
      setHasKey(true)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to sign message")
      }
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Connection</CardTitle>
        <CardDescription>
          Connect your Solana wallet to manage your subscription and encrypt your secrets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <Alert variant="success" className="bg-green-50 dark:bg-green-950/30">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Wallet Connected</AlertTitle>
              <AlertDescription>
                Your wallet is connected to Solana Devnet and ready for payments and encryption.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full ${walletType === "metamask" ? "bg-orange-500" : walletType === "phantom" ? "bg-purple-500" : "bg-blue-500"} flex items-center justify-center`}
                  >
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {walletType === "metamask"
                          ? "MetaMask (Solana)"
                          : walletType === "phantom"
                            ? "Phantom"
                            : walletType === "solflare"
                              ? "Solflare"
                              : "Backpack"}
                      </p>
                      {walletType === "metamask" && (
                        <Badge variant="outline" className="text-xs">
                          Beta
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-mono text-muted-foreground">{walletAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Balance</div>
                  <div className="font-medium">{solBalance} SOL</div>
                </div>
              </div>

              {!hasKey && (
                <div className="mt-4 pt-4 border-t">
                  <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle>Encryption Key Required</AlertTitle>
                    <AlertDescription>
                      Sign a message with your wallet to generate your encryption key for secure access to your secrets.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleSignMessage}
                    disabled={isSigning}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {isSigning ? "Signing..." : "Sign Message for Encryption"}
                  </Button>

                  {error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {hasKey && (
                <div className="mt-4 pt-4 border-t">
                  <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Encryption Ready</AlertTitle>
                    <AlertDescription>
                      Your wallet-derived encryption key is active. You can now securely encrypt and decrypt your
                      secrets.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="connect">Connection</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
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

                    <Button variant="outline" onClick={handleDisconnect} className="w-full">
                      Disconnect Wallet
                    </Button>
                  </TabsContent>

                  <TabsContent value="transactions" className="pt-4">
                    <div className="space-y-3">
                      <div className="text-sm">Recent Transactions</div>

                      <div className="rounded border p-3">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Subscription Payment</div>
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                          >
                            -0.5 SOL
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs text-muted-foreground">May 1, 2023</div>
                          <a
                            href="https://explorer.solana.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-blue-500"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      <div className="rounded border p-3">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Subscription Payment</div>
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                          >
                            -0.5 SOL
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs text-muted-foreground">April 1, 2023</div>
                          <a
                            href="https://explorer.solana.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-blue-500"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
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

                    <div className="space-y-2">
                      <div className="font-medium">Auto-pay Subscription</div>
                      <div className="flex items-center justify-between rounded border p-3">
                        <div className="text-sm">Enable automatic payments</div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        >
                          Enabled
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-950/30">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Connect your Solana wallet to access premium features, manage your subscription, and encrypt your
                secrets.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-between"
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
                className="w-full flex items-center justify-between"
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
                className="w-full flex items-center justify-between"
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
