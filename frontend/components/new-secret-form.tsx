"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

type EncryptedSecret = {
  id: string
  key: string
  encryptedData: {
    encrypted: string
    nonce: string
    authHash: string
  }
  projectId: string
  environment: string
  createdAt: string
  updatedAt: string
}

export function NewSecretForm({ 
  projectId, 
  environment, 
  onSecretAdded 
}: { 
  projectId: string
  environment: string
  onSecretAdded: (secret: EncryptedSecret) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [secretKey, setSecretKey] = useState("")
  const [secretValue, setSecretValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { connected } = useWallet()
  const { isInitialized, handleSignMessage, encryptData } = useWalletEncryption()
  const { toast } = useToast()

  // Validate props on mount
  useEffect(() => {
    if (!projectId || !environment) {
      console.error('Missing required props:', { projectId, environment });
    }
  }, [projectId, environment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate wallet connection and form inputs
      if (!connected) {
        throw new Error("Please connect your wallet first")
      }

      if (!secretKey.trim() || !secretValue.trim()) {
        throw new Error("Secret key and value are required")
      }

      if (!projectId) {
        throw new Error("Project ID is missing")
      }

      if (!environment) {
        throw new Error("Environment is missing")
      }

      // Initialize encryption if needed
      if (!isInitialized) {
        console.log('Initializing encryption...');
        try {
          await handleSignMessage();
        } catch (error) {
          throw new Error(`Failed to initialize encryption: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Encrypt the secret value
      console.log('Encrypting secret...');
      const encryptedData = await encryptData(secretValue);
      
      if (!encryptedData) {
        throw new Error('Encryption failed');
      }

      // Prepare the new secret data
      const newSecret: EncryptedSecret = {
        id: crypto.randomUUID(),
        key: secretKey.trim(),
        encryptedData,
        projectId,
        environment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the secret
      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSecret),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save secret: ${error}`);
      }

      // Get the saved secret from response
      const savedSecret = await response.json();

      // Close the dialog and reset form
      setIsOpen(false)
      setSecretKey("")
      setSecretValue("")
      
      // Notify parent component
      onSecretAdded(savedSecret);

      toast({
        title: "Success",
        description: "Secret has been encrypted and saved.",
      })
    } catch (error) {
      console.error('Error saving secret:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save secret",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Add Secret
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Secret</DialogTitle>
            <DialogDescription>
              Enter the key and value for your new secret. The value will be encrypted with your wallet&apos;s signature.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">Secret Key</Label>
              <Input
                id="key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="API_KEY"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Secret Value</Label>
              <Input
                id="value"
                type="password"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder="Enter secret value"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !connected || !secretKey || !secretValue}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Adding..." : "Add Secret"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
