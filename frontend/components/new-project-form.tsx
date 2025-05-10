"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletEncryption } from "@/hooks/use-wallet-encryption"

export function NewProjectForm() {
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [environments, setEnvironments] = useState({
    development: true,
    staging: false,
    production: false
  })
  const router = useRouter()
  const { toast } = useToast()
  const { connected } = useWallet()
  const { isInitialized, handleSignMessage, error: walletError } = useWalletEncryption()

  // Initialize wallet encryption if connected but not initialized
  useEffect(() => {
    if (connected && !isInitialized && !isLoading) {
      handleSignMessage().catch(err => {
        console.error('Failed to initialize wallet encryption:', err)
        toast({
          title: "Wallet Error",
          description: "Failed to initialize wallet encryption. Please try again.",
          variant: "destructive",
        })
      })
    }
  }, [connected, isInitialized, handleSignMessage, toast, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!connected) {
        throw new Error('Please connect your wallet first')
      }

      if (!isInitialized) {
        throw new Error('Please initialize wallet encryption first')
      }

      // Get the encryption key
      const encryptionKey = localStorage.getItem('solkey_encryption_key')
      if (!encryptionKey) {
        throw new Error('Please initialize wallet encryption first')
      }

      // Log encryption key before use
      console.log('Encryption key check:', {
        exists: !!encryptionKey,
        length: encryptionKey?.length,
        preview: encryptionKey ? `${encryptionKey.slice(0, 10)}...` : 'none'
      });

      // Create the project with encryption key
      const walletSignature = encryptionKey?.replace('0x', '') || '';
      console.log('Using wallet signature:', walletSignature ? `${walletSignature.slice(0, 10)}...` : 'none');
      
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-signature': walletSignature
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim() || '',
          environments: Object.entries(environments)
            .filter(([_, enabled]) => enabled)
            .map(([name]) => name)
        }),
      })

      // Parse response first
      let responseData;
      try {
        responseData = await projectResponse.json();
        console.log('Server response:', {
          status: projectResponse.status,
          data: responseData,
          headers: Object.fromEntries(projectResponse.headers.entries())
        });
      } catch (error) {
        console.error('Failed to parse server response:', error);
        throw new Error('Invalid response from server. Please contact support if this persists.');
      }

      // Check for specific error types
      if (!projectResponse.ok) {
        console.error('Project creation failed:', {
          status: projectResponse.status,
          error: responseData.error,
          details: responseData.details,
          type: responseData.type
        });

        let errorMessage = 'Failed to create project';
        
        // Handle specific error types
        switch (responseData.type) {
          case 'DuplicateKey':
            errorMessage = 'A project with this name already exists. Please choose a different name.';
            break;
          case 'ValidationError':
            errorMessage = responseData.details?.join('\n') || 'Invalid project data. Please check your inputs.';
            break;
          case 'EnvironmentError':
            errorMessage = 'Failed to create environment. Please try again.';
            break;
          default:
            errorMessage = responseData.error || responseData.details?.join('\n') || errorMessage;
        }

        throw new Error(errorMessage);
      }
      
      if (!responseData.project?._id) {
        console.error('Invalid project response:', {
          status: projectResponse.status,
          data: responseData
        });
        throw new Error('Server returned an invalid response. Please contact support.')
      }

      // Show success message
      toast({
        title: "Success",
        description: "Project created! Opening the secrets editor...",
      })

      // Navigate to project page
      const projectId = responseData.project._id;
      console.log('Navigating to project:', projectId);
      
      // Force a client-side navigation
      router.refresh(); // Refresh data
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      router.push(`/dashboard/projects/${projectId}`); // Navigate
      router.refresh(); // Refresh again after navigation
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEnvironment = (env: keyof typeof environments) => {
    setEnvironments(prev => ({
      ...prev,
      [env]: !prev[env]
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Enter the details for your new project. You can manage your environments and secrets after creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="e.g., Backend API, Web Dashboard"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description (Optional)</Label>
            <Textarea
              id="project-description"
              placeholder="Brief description of your project"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Environments</h3>
              <p className="text-xs text-muted-foreground">
                Select which environments you want to create. You can add or remove environments later.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="env-development" 
                  checked={environments.development}
                  onCheckedChange={() => toggleEnvironment('development')}
                />
                <Label htmlFor="env-development" className="text-sm font-normal">
                  Development
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="env-staging" 
                  checked={environments.staging}
                  onCheckedChange={() => toggleEnvironment('staging')}
                />
                <Label htmlFor="env-staging" className="text-sm font-normal">
                  Staging
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="env-production" 
                  checked={environments.production}
                  onCheckedChange={() => toggleEnvironment('production')}
                />
                <Label htmlFor="env-production" className="text-sm font-normal">
                  Production
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => window.location.href = "/dashboard/projects"}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !projectName.trim() || !connected || !isInitialized}
            >
              {isLoading 
                ? "Creating Project..." 
                : !connected 
                ? "Connect Wallet to Create" 
                : !isInitialized 
                ? "Initialize Encryption" 
                : "Create Project"}
            </Button>
          </div>
          {walletError && (
            <p className="text-sm text-destructive">{walletError}</p>
          )}
        </CardFooter>
      </Card>
    </form>
  )
}
