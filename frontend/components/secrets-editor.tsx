"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, AlertCircle, Shield } from "lucide-react"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import { useToast } from "@/hooks/use-toast"

interface EncryptedSecret {
  id: string
  key: string
  encryptedData: {
    encrypted: string
    nonce: string
    authHash: string
  }
  decryptedValue?: string
}

interface SecretsEditorProps {
  projectId: string
  environment: string
  searchQuery: string
}

export function SecretsEditor({ projectId, environment, searchQuery }: SecretsEditorProps) {
  const [secrets, setSecrets] = useState<EncryptedSecret[]>([])
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { encryptData, decryptData } = useWalletEncryption()
  const { toast } = useToast()

  // Load secrets from API
  useEffect(() => {
    const loadSecrets = async () => {
      try {
        const response = await fetch(`/api/secrets?projectId=${projectId}&environment=${environment}`)
        if (!response.ok) {
          throw new Error('Failed to load secrets')
        }
        const data = await response.json()
        setSecrets(data)
      } catch (error) {
        console.error('Error loading secrets:', error)
        toast({
          title: "Error Loading Secrets",
          description: "Failed to load secrets. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSecrets()
  }, [projectId, environment, toast])

  // Filter secrets based on search query
  const filteredSecrets = secrets.filter(secret =>
    secret.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addSecret = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Both key and value are required",
        variant: "destructive",
      })
      return
    }

    try {
      const encryptedData = await encryptData(newValue)
      
      const newSecret: EncryptedSecret = {
        id: crypto.randomUUID(),
        key: newKey.trim(),
        encryptedData,
      }

      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSecret,
          projectId,
          environment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save secret')
      }

      const savedSecret = await response.json()
      setSecrets([...secrets, savedSecret])
      setNewKey("")
      setNewValue("")

      toast({
        title: "Success",
        description: "Secret added successfully",
      })
    } catch (err) {
      console.error('Error adding secret:', err)
      toast({
        title: "Error",
        description: "Failed to add secret",
        variant: "destructive",
      })
    }
  }

  const decryptSecret = async (secret: EncryptedSecret) => {
    try {
      const decrypted = await decryptData(secret.encryptedData)
      setSecrets(secrets.map(s => 
        s.id === secret.id 
          ? { ...s, decryptedValue: decrypted } 
          : s
      ))
    } catch (err) {
      console.error('Error decrypting secret:', err)
      toast({
        title: "Decryption Error",
        description: "Failed to decrypt the secret. Please check your wallet connection.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading secrets...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Secret</CardTitle>
          <CardDescription>
            Enter a key and value for your new secret. The value will be encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Secret Key</Label>
            <Input
              id="key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter secret key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Secret Value</Label>
            <Textarea
              id="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter secret value"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={addSecret} className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Add Secret
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        {filteredSecrets.map((secret) => (
          <Card key={secret.id}>
            <CardHeader>
              <CardTitle>{secret.key}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Encrypted Data</Label>
                <div className="bg-muted p-2 rounded">
                  <code className="text-sm font-mono break-all">
                    {secret.encryptedData.encrypted}
                  </code>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Encryption Details</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold">Nonce:</span>
                    <div className="bg-muted p-1 rounded">
                      <code className="font-mono break-all text-xs">
                        {secret.encryptedData.nonce}
                      </code>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Auth Hash:</span>
                    <div className="bg-muted p-1 rounded">
                      <code className="font-mono break-all text-xs">
                        {secret.encryptedData.authHash}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {secret.decryptedValue ? (
                <div className="space-y-2">
                  <Label>Decrypted Value</Label>
                  <div className="bg-muted p-2 rounded border border-green-500">
                    <code className="text-sm font-mono break-all">
                      {secret.decryptedValue}
                    </code>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => decryptSecret(secret)}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Decrypt Value
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
