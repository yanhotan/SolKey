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
import { toast } from "@/hooks/use-toast"
import { saveProject } from "@/lib/local-storage"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletUser } from "@/hooks/use-wallet-user"
// import { useWalletEncryption } from "@/hooks/use-wallet-encryption"

export function NewProjectForm() {
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [environments, setEnvironments] = useState({
    development: true,
    staging: true,
    production: true,
  })
  const router = useRouter()
  const { connected, publicKey } = useWallet()
  const { user, isLoading: userLoading, error: userError } = useWalletUser()
  // const { isInitialized, handleSignMessage } = useWalletEncryption()

  // useEffect(() => {
  //   if (connected && !isInitialized && !isLoading) {
  //     handleSignMessage().catch((err: unknown) => {
  //       console.error('Failed to initialize wallet encryption:', err);
  //       toast({
  //         title: "Wallet Error",
  //         description: err instanceof Error ? err.message : 'Failed to initialize encryption',
  //         variant: "destructive",
  //       });
  //     });
  //   }
  // }, [connected, isInitialized, handleSignMessage, isLoading]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!connected) {
        throw new Error('Please connect your wallet first');
      }
      
      // Get wallet address
      const walletAddress = publicKey?.toBase58();
      if (!walletAddress) {
        throw new Error('Could not retrieve your wallet address. Please reconnect your wallet.');
      }
      
      // Wait for user to be loaded if necessary
      if (!user && !userLoading) {
        throw new Error('User information not available. Please try again.');
      }

      // if (!isInitialized) {
      //   // Try to initialize encryption
      //   await handleSignMessage();
      // }
      // if (!isInitialized) {
      //   // Try to initialize encryption
      //   await handleSignMessage();
      // }

      // Get the encryption key
      // const encryptionKey = localStorage.getItem('solkey_encryption_key');
      // if (!encryptionKey) {
      //   throw new Error('Failed to generate encryption key. Please try again.');
      // }

      // Generate project ID and data
      const projectSlug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const projectId = `${projectSlug}-${Date.now().toString().slice(-6)}`;
      
      // Get selected environments
      const selectedEnvironments = Object.entries(environments)
        .filter(([_, isSelected]) => isSelected)
        .map(([env]) => env);

      // Create project data
      const newProject = {
        id: projectId,
        name: projectName.trim(),
        description: projectDescription.trim(),
        environments: selectedEnvironments,
        wallet_address: walletAddress, // Associate with wallet address
        user_id: user?.id, // Link to user if available
        createdAt: new Date().toISOString(),        
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        // encryptionKey: encryptionKey // Store encryption key with project
      };

      // Save to localStorage
      const saved = saveProject(newProject);
      if (!saved) {
        throw new Error('Failed to save project');
      }
      
      // Include optional debug info for troubleshooting
      console.log('Creating project with user data:', {
        userId: user?.id,
        walletAddress,
        hasUserData: !!user
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/projects`, 
        {method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
          environments: selectedEnvironments,
          creatorId: user?.id, // Using the user ID from the hook if available
          creatorWalletAddress: walletAddress,
          // Send a flag that tells the backend to ensure the user exists
          ensureUserExists: true
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to create project");
      }

      const project = await response.json();
      toast({
        title: "Project created",
        description: `${project.name} has been created successfully.`,
      });

      // Navigate to the new project
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnvironmentChange = (env: keyof typeof environments, checked: boolean) => {
    setEnvironments((prev) => ({
      ...prev,
      [env]: checked,
    }));
  };

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
              <h3 className="text-sm font-medium">Default Environments</h3>
              <p className="text-xs text-muted-foreground">
                Select which environments you want to create by default. You can add or remove environments later.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="env-development"
                  checked={environments.development}
                  onCheckedChange={(checked) => handleEnvironmentChange("development", checked === true)}
                />
                <Label htmlFor="env-development" className="text-sm font-normal">
                  Development
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="env-staging"
                  checked={environments.staging}
                  onCheckedChange={(checked) => handleEnvironmentChange("staging", checked === true)}
                />
                <Label htmlFor="env-staging" className="text-sm font-normal">
                  Staging
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="env-production"
                  checked={environments.production}
                  onCheckedChange={(checked) => handleEnvironmentChange("production", checked === true)}
                />
                <Label htmlFor="env-production" className="text-sm font-normal">
                  Production
                </Label>
              </div>
            </div>
          </div>
        </CardContent>        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.push("/dashboard/projects")}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !projectName.trim() || !connected}
          >
            {isLoading ? "Creating Project..." : 
             !connected ? "Connect Wallet to Create" :
             userLoading ? "Loading User Data..." :
             userError ? "Error Loading Wallet Data" :
             "Create Project"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
