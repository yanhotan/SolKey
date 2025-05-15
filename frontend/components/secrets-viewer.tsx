"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Lock, Eye, EyeOff, Shield, AlertCircle, RefreshCcw, Bug, Unlock, Database, Key } from "lucide-react"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import { api } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Secret {
  id: string
  name: string
  encrypted_value: string
  iv: string
  auth_tag: string
  encrypted_aes_key: string
  nonce: string
  ephemeral_public_key: string
  created_at: string
}

interface ApiResponse {
  id: string
  name: string
  encrypted_value: string
  iv: string
  auth_tag: string
  encrypted_aes_key: string
  nonce: string
  ephemeral_public_key: string
  [key: string]: any
}

export function SecretsViewer() {
  const { publicKey, connected } = useWallet()
  const { isInitialized, decryptData } = useWalletEncryption()
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<{[key: string]: 'idle' | 'loading' | 'success' | 'error'}>({})
  const [error, setError] = useState<string | null>(null)
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({})
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const [decryptionErrors, setDecryptionErrors] = useState<Record<string, string>>({})
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [encryptedData, setEncryptedData] = useState<Record<string, ApiResponse | null>>({})
  const [fetchStatus, setFetchStatus] = useState<{[key: string]: 'idle' | 'loading' | 'success' | 'error'}>({})

  // Fetch secrets when wallet is connected
  useEffect(() => {
    if (connected && publicKey && isInitialized) {
      fetchSecrets()
    }
  }, [connected, publicKey, isInitialized])

  const fetchSecrets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!publicKey) {
        throw new Error("Wallet not connected")
      }

      // Use your API to fetch secrets
      const response = await api.secrets.list({
        walletAddress: publicKey.toBase58(),
        signature: localStorage.getItem(`solkey:signature`) || ""
      })

      setSecrets(response.data || [])
    } catch (err) {
      console.error("Failed to fetch secrets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch secrets")
    } finally {
      setLoading(false)
    }
  }

  const fetchEncryptedData = async (secretId: string) => {
    try {
      // Set status to loading
      setFetchStatus(prev => ({ ...prev, [secretId]: 'loading' }))
      setEncryptedData(prev => ({ ...prev, [secretId]: null }))
      
      // Clear any previous errors
      setError(null)
      setDecryptionErrors(prev => ({ ...prev, [secretId]: '' }))
      
      // Validation checks
      if (!connected) {
        throw new Error("Wallet not connected")
      }
      
      if (!publicKey) {
        throw new Error("No public key available")
      }
      
      if (!isInitialized) {
        throw new Error("Wallet encryption not initialized")
      }

      // Get signature from local storage
      const signature = localStorage.getItem(`solkey:signature`)
      if (!signature) {
        throw new Error("Missing wallet signature. Please reconnect your wallet.")
      }

      console.log(`Fetching encrypted data for secret ${secretId}`)
      
      // Fetch the encrypted data from the API
      const response = await api.secrets.fetchEncrypted(secretId, {
        walletAddress: publicKey.toBase58(),
        signature
      })
      
      // Save the encrypted data
      setEncryptedData(prev => ({ ...prev, [secretId]: response }))
      setFetchStatus(prev => ({ ...prev, [secretId]: 'success' }))
      
      console.log('Encrypted data fetched successfully')
      return response
    } catch (err) {
      console.error("Failed to fetch encrypted data:", err)
      setFetchStatus(prev => ({ ...prev, [secretId]: 'error' }))
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch encrypted data"
      setDecryptionErrors(prev => ({ ...prev, [secretId]: errorMsg }))
      return null
    }
  }

  const decryptSecret = async (secretId: string) => {
    try {
      // Set loading state for this specific secret
      setApiStatus(prev => ({ ...prev, [secretId]: 'loading' }))
      
      // If already decrypted, just toggle visibility
      if (decryptedValues[secretId]) {
        setVisibleSecrets(prev => ({
          ...prev,
          [secretId]: !prev[secretId]
        }))
        setApiStatus(prev => ({ ...prev, [secretId]: 'success' }))
        return
      }

      // Make sure we have the encrypted data
      let secretData = encryptedData[secretId]
      if (!secretData) {
        // If we don't have it yet, fetch it
        secretData = await fetchEncryptedData(secretId)
        if (!secretData) {
          throw new Error("Failed to fetch encrypted data")
        }
      }
      
      // Attempt to decrypt
      try {
        console.log(`Decrypting data for secret ${secretId}`)
        const decrypted = await decryptData({
          encrypted: secretData.encrypted_value,
          nonce: secretData.nonce,
          authHash: secretData.auth_tag
        })

        if (!decrypted) {
          throw new Error("Decryption failed - null result")
        }

        // Save the decrypted value and make it visible
        setDecryptedValues(prev => ({
          ...prev,
          [secretId]: decrypted
        }))
        
        setVisibleSecrets(prev => ({
          ...prev,
          [secretId]: true
        }))
        
        setApiStatus(prev => ({ ...prev, [secretId]: 'success' }))
      } catch (error) {
        console.error(`Decryption error for secret ${secretId}:`, error)
        setApiStatus(prev => ({ ...prev, [secretId]: 'error' }))
        const errorMsg = error instanceof Error ? error.message : "Failed to decrypt data"
        setDecryptionErrors(prev => ({ ...prev, [secretId]: `Decryption Error: ${errorMsg}` }))
        throw error
      }
    } catch (err) {
      console.error("Secret operation failed:", err)
      setError(err instanceof Error ? err.message : "Failed to decrypt secret")
      setApiStatus(prev => ({ ...prev, [secretId]: 'error' }))
    }
  }

  const runDiagnostics = async (secretId: string) => {
    try {
      if (!publicKey) {
        throw new Error("No public key available")
      }
      
      setApiStatus(prev => ({ ...prev, [secretId]: 'loading' }))
      setDiagnosticResults(null)
      
      const signature = localStorage.getItem(`solkey:signature`) || ""
      
      // Try to directly access the endpoint and get raw response
      const result = await api.secrets.debugFetchRaw(secretId, {
        walletAddress: publicKey.toBase58(),
        signature
      })
      
      setDiagnosticResults(result)
      setShowDiagnostics(true)
    } catch (err) {
      console.error("Diagnostics failed:", err)
      setError(err instanceof Error ? err.message : "Diagnostics failed")
    } finally {
      setApiStatus(prev => ({ ...prev, [secretId]: 'idle' }))
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

  // Handle loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Secrets</CardTitle>
          <CardDescription>Loading your encrypted secrets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Your Secrets</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="gap-1"
          >
            <Bug className="h-4 w-4" />
            {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
          </Button>
        </CardTitle>
        <CardDescription>
          {secrets.length 
            ? "View and decrypt your secrets in a step-by-step process" 
            : "You don't have any secrets yet"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showDiagnostics && diagnosticResults && (
          <Alert className={diagnosticResults.ok ? "bg-green-50 border-green-200 mb-4" : "bg-orange-50 border-orange-200 mb-4"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Diagnostic Results</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status: </span>
                  <span className={diagnosticResults.ok ? "text-green-600" : "text-red-600"}>
                    {diagnosticResults.status} {diagnosticResults.statusText}
                  </span>
                </div>
                
                {diagnosticResults.data && diagnosticResults.data.step && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Failed at step: </span>
                    <span className="text-orange-600">{diagnosticResults.data.step}</span>
                  </div>
                )}
                
                {diagnosticResults.data && diagnosticResults.data.error && (
                  <div>
                    <span className="font-medium">Error message: </span>
                    <span className="text-red-600 block mt-1">{diagnosticResults.data.error}</span>
                  </div>
                )}
                
                {diagnosticResults.data && diagnosticResults.data.details && (
                  <div>
                    <span className="font-medium">Additional details: </span>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1">
                      {JSON.stringify(diagnosticResults.data.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="pt-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">View raw response</summary>
                    <pre className="mt-2 font-mono text-xs bg-background p-2 rounded-md overflow-auto max-h-96">
                      {JSON.stringify(diagnosticResults, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          {secrets.map(secret => (
            <div key={secret.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{secret.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => runDiagnostics(secret.id)}
                    disabled={apiStatus[secret.id] === 'loading' || fetchStatus[secret.id] === 'loading'}
                    title="Run API diagnostics"
                  >
                    <Bug className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {decryptionErrors[secret.id] && (
                <Alert variant="destructive" className="mb-4 py-2 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{decryptionErrors[secret.id]}</AlertDescription>
                </Alert>
              )}
              
              <Tabs defaultValue="steps" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="steps" className="flex-1">Step by Step</TabsTrigger>
                  <TabsTrigger value="data" className="flex-1">Raw Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="steps">
                  <div className="space-y-4">
                    {/* Step 1: Fetch Encrypted Data */}
                    <div className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step 1</Badge>
                          <h4 className="font-medium">Fetch Encrypted Data</h4>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchEncryptedData(secret.id)}
                          disabled={fetchStatus[secret.id] === 'loading'}
                        >
                          {fetchStatus[secret.id] === 'loading' ? (
                            <>
                              <RefreshCcw className="h-3 w-3 mr-2 animate-spin" />
                              Fetching...
                            </>
                          ) : fetchStatus[secret.id] === 'success' ? (
                            <>
                              <Database className="h-3 w-3 mr-2" />
                              Refetch
                            </>
                          ) : (
                            <>
                              <Database className="h-3 w-3 mr-2" />
                              Fetch
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {encryptedData[secret.id] && (
                        <div className="text-sm mt-2">
                          <p className="text-green-600 mb-2">✓ Data fetched successfully</p>
                          <div className="bg-slate-50 p-2 rounded-md space-y-1">
                            <p className="text-xs font-medium mb-1">Layer 1: Asymmetric Encryption (Your Wallet's Key)</p>
                            <div className="grid grid-cols-2 pl-2">
                              <span className="font-mono text-xs">Encrypted AES Key:</span>
                              <span className="font-mono text-xs truncate">{encryptedData[secret.id]?.encrypted_aes_key?.substring(0, 20)}...</span>
                            </div>
                            <div className="grid grid-cols-2 pl-2">
                              <span className="font-mono text-xs">Nonce:</span>
                              <span className="font-mono text-xs truncate">{encryptedData[secret.id]?.nonce}</span>
                            </div>
                            
                            <p className="text-xs font-medium mt-2 mb-1">Layer 2: Symmetric Encryption (AES-GCM)</p>
                            <div className="grid grid-cols-2 pl-2">
                              <span className="font-mono text-xs">Encrypted Value:</span>
                              <span className="font-mono text-xs truncate">{encryptedData[secret.id]?.encrypted_value?.substring(0, 20)}...</span>
                            </div>
                            <div className="grid grid-cols-2 pl-2">
                              <span className="font-mono text-xs">IV:</span>
                              <span className="font-mono text-xs truncate">{encryptedData[secret.id]?.iv}</span>
                            </div>
                            <div className="grid grid-cols-2 pl-2">
                              <span className="font-mono text-xs">Auth Tag:</span>
                              <span className="font-mono text-xs truncate">{encryptedData[secret.id]?.auth_tag}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Step 2: Decrypt Data */}
                    <div className={`border rounded-md p-3 ${!encryptedData[secret.id] ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step 2</Badge>
                          <h4 className="font-medium">Decrypt Data</h4>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => decryptSecret(secret.id)}
                          disabled={!encryptedData[secret.id] || apiStatus[secret.id] === 'loading'}
                        >
                          {apiStatus[secret.id] === 'loading' ? (
                            <>
                              <RefreshCcw className="h-3 w-3 mr-2 animate-spin" />
                              Decrypting...
                            </>
                          ) : decryptedValues[secret.id] ? (
                            <>
                              <Eye className="h-3 w-3 mr-2" />
                              {visibleSecrets[secret.id] ? 'Hide' : 'Show'}
                            </>
                          ) : (
                            <>
                              <Key className="h-3 w-3 mr-2" />
                              Decrypt
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {decryptedValues[secret.id] && (
                        <div className="text-sm mt-2">
                          <p className="text-green-600 mb-2">✓ Data decrypted successfully</p>
                          <div className="bg-slate-50 p-2 rounded-md">
                            <p className="font-mono text-xs mb-1">Decrypted Value:</p>
                            <div className="font-mono text-sm bg-white border p-2 rounded-md">
                              {visibleSecrets[secret.id] ? decryptedValues[secret.id] : "••••••••••••••••••••••••••"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="data">
                  <div className="font-mono text-xs bg-slate-50 p-3 rounded-md">
                    <pre className="whitespace-pre-wrap break-all">
                      {encryptedData[secret.id] 
                        ? JSON.stringify(encryptedData[secret.id], null, 2)
                        : "No data fetched yet. Click 'Fetch' in the Step by Step tab to fetch encrypted data."}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ))}
          
          {secrets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No secrets found. Create some secrets to see them here.
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="w-full flex items-center justify-center text-xs text-muted-foreground gap-2">
          <Shield className="h-3 w-3" />
          <span>End-to-end encrypted with your wallet</span>
        </div>
      </CardFooter>
    </Card>
  )
} 