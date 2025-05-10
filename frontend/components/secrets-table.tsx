"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Copy, MoreHorizontal } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import { NewSecretForm } from "./new-secret-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { EncryptedData } from "@/lib/crypto"

type EncryptedSecret = {
  id: string
  key: string
  encryptedData: EncryptedData
  projectId: string
  environment: string
  createdAt: string
  updatedAt: string
}

export function SecretsTable({ 
  projectId,
  environment, 
  searchQuery 
}: { 
  projectId: string
  environment: string
  searchQuery: string 
}) {
  const [secrets, setSecrets] = useState<EncryptedSecret[]>([])
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({})
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  const { connected } = useWallet()
  const { decryptData, isInitialized } = useWalletEncryption()
  const { toast } = useToast()

  // Load secrets from the API
  useEffect(() => {
    const loadSecrets = async () => {
      try {
        const response = await fetch(`/api/secrets?projectId=${projectId}&environment=${environment}`)
        if (!response.ok) throw new Error('Failed to load secrets')
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

  // Clear decrypted values when wallet disconnects
  useEffect(() => {
    if (!connected || !isInitialized) {
      setDecryptedValues({})
      setShowValues({})
    }
  }, [connected, isInitialized])

  const toggleShowValue = async (secret: EncryptedSecret) => {
    if (!showValues[secret.id]) {
      if (!connected || !isInitialized) {
        toast({
          title: "Wallet Required",
          description: "Please connect your wallet to view secret values",
          variant: "default",
        })
        return
      }

      // Only decrypt if we haven't already
      if (!decryptedValues[secret.id]) {
        try {
          const decrypted = await decryptData(secret.encryptedData)
          if (decrypted) {
            setDecryptedValues(prev => ({
              ...prev,
              [secret.id]: decrypted
            }))
          }
        } catch (error) {
          console.error("Failed to decrypt:", error)
          toast({
            title: "Decryption Failed",
            description: "Failed to decrypt secret value. Please try reconnecting your wallet.",
            variant: "destructive",
          })
          return
        }
      }
    }

    setShowValues(prev => ({
      ...prev,
      [secret.id]: !prev[secret.id]
    }))
  }

  const handleCopy = async (secret: EncryptedSecret) => {
    if (!connected || !isInitialized) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to copy secret values",
        variant: "default",
      })
      return
    }

    try {
      let valueToCopy = decryptedValues[secret.id]
      
      if (!valueToCopy) {
        const decrypted = await decryptData(secret.encryptedData)
        if (!decrypted) {
          throw new Error('Failed to decrypt value')
        }
        valueToCopy = decrypted
        setDecryptedValues(prev => ({
          ...prev,
          [secret.id]: decrypted
        }))
      }

      if (valueToCopy) {
        await navigator.clipboard.writeText(valueToCopy)
        toast({
          title: "Copied",
          description: "Secret value copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy secret value",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (secret: EncryptedSecret) => {
    try {
      const response = await fetch(`/api/secrets/${secret.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete secret')
      
      setSecrets(prev => prev.filter(s => s.id !== secret.id))
      setDecryptedValues(prev => {
        const newValues = { ...prev }
        delete newValues[secret.id]
        return newValues
      })
      
      toast({
        title: "Secret Deleted",
        description: "The secret has been deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete the secret",
        variant: "destructive",
      })
    }
  }

  const handleSecretAdded = (newSecret: EncryptedSecret) => {
    setSecrets(prev => [...prev, newSecret])
  }

  const filteredSecrets = secrets.filter(secret => 
    secret.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <div>Loading secrets...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Secrets</h3>
        <NewSecretForm
          projectId={projectId}
          environment={environment}
          onSecretAdded={handleSecretAdded}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSecrets.map((secret) => (
              <TableRow key={secret.id}>
                <TableCell className="font-medium">{secret.key}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded flex-1 font-mono text-sm">
                      {showValues[secret.id]
                        ? decryptedValues[secret.id] || "•".repeat(12)
                        : "•".repeat(12)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleShowValue(secret)}
                    >
                      {showValues[secret.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(secret)}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(secret.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopy(secret)}>
                        Copy Value
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(secret)}
                      >
                        Delete Secret
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
