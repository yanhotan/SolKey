"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Lock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { SecretItem } from "@/components/secret-item"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"

interface Secret {
  id: string
  name: string
  type: string
  projectName: string
  environmentName: string
}

export function SecretsList() {
  const { publicKey, connected } = useWallet()
  const { isInitialized } = useWalletEncryption()
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch secrets metadata immediately when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchSecretsMetadata()
    } else {
      // Clear secrets when wallet disconnects
      setSecrets([])
    }
  }, [connected, publicKey])

  // Fetch secret metadata without requiring signature
  const fetchSecretsMetadata = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!publicKey) {
        throw new Error("Wallet not connected")
      }

      // Fetch basic secrets metadata (no signature required)
      console.log('Fetching secrets metadata for wallet', publicKey.toBase58())
      const response = await api.secrets.listMetadata(publicKey.toBase58())
      
      if (response.secrets && response.secrets.length > 0) {
        console.log(`Found ${response.secrets.length} secrets for this wallet`)
        setSecrets(response.secrets)
      } else {
        console.log('No secrets found for this wallet')
        setSecrets([])
      }
    } catch (err) {
      console.error("Failed to fetch secrets metadata:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch secrets metadata")
    } finally {
      setLoading(false)
    }
  }

  // Handle case where wallet is not connected
  if (!connected || !publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Not Connected</CardTitle>
          <CardDescription>Please connect your wallet to view your secrets</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Secrets</CardTitle>
            <CardDescription>
              {secrets.length > 0 
                ? isInitialized 
                  ? "End-to-end encrypted secrets that only your wallet can access" 
                  : "Connect your wallet and sign to decrypt these secrets"
                : "You don't have any secrets yet"}
            </CardDescription>
            {!isInitialized && secrets.length > 0 && (
              <p className="text-xs text-amber-500 mt-1">
                Click "Sign & Decrypt" on any secret to enable decryption
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchSecretsMetadata} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isInitialized && secrets.length > 0 && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <span className="font-medium">Wallet not authenticated:</span> You must sign a message to decrypt secrets.
              Click "Sign & Decrypt" on any secret to begin.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {secrets.length > 0 ? (
              <div className="space-y-4">
                {secrets.map(secret => (
                  <SecretItem 
                    key={secret.id}
                    id={secret.id}
                    name={secret.name}
                    type={secret.type}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium mb-1">No Secrets Found</h3>
                <p className="text-muted-foreground">
                  Create your first secret to securely store sensitive information
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}