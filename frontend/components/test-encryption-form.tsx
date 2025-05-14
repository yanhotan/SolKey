"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSecretEncryption } from "@/hooks/use-secret-encryption"
import { useWallet } from "@solana/wallet-adapter-react"
import { LoaderCircle, CheckCircle2, XCircle, EyeIcon, EyeOffIcon, RefreshCcw } from "lucide-react"
import { EncryptedData } from "@/lib/crypto"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Project and environment types
type ProjectOption = {
  id: string;
  name: string;
  description?: string;
  status?: string;
};

type EnvironmentOption = {
  id: string;
  name: string;
  projectId: string;
};

export function TestEncryptionForm() {
  // Wallet connection
  const { publicKey, connected } = useWallet();
  
  // Secret encryption hook
  const { 
    createSecret, 
    fetchSecret, 
    decryptSecret, 
    isLoading, 
    error 
  } = useSecretEncryption();
  
  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [secretName, setSecretName] = useState<string>('');
  const [secretValue, setSecretValue] = useState<string>('');
  const [secretType, setSecretType] = useState<string>('String');
  
  // Result state
  const [createdSecretId, setCreatedSecretId] = useState<string | null>(null);
  const [encryptedData, setEncryptedData] = useState<EncryptedData | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  
  // Data loading state
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isLoadingEnvironments, setIsLoadingEnvironments] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentOption[]>([]);
  const [filteredEnvironments, setFilteredEnvironments] = useState<EnvironmentOption[]>([]);
  
  // Fetch projects on component mount or when wallet connects
  useEffect(() => {
    fetchProjects();
  }, [connected, publicKey]);
  
  const fetchProjects = async () => {
    if (!connected || !publicKey) return;
    
    setIsLoadingProjects(true);
    setFetchError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/projects?walletAddress=${publicKey.toBase58()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Set projects
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects);
        
        // Set default selected project if available
        if (data.projects.length > 0) {
          const defaultProject = data.projects[0];
          setSelectedProjectId(defaultProject.id);
          
          // Fetch environments for this project
          fetchEnvironments(defaultProject.id);
        }
      } else {
        setProjects([]);
        console.warn('No projects found or invalid format');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  // Fetch environments based on selected project
  const fetchEnvironments = async (projectId?: string) => {
    if (!connected || !publicKey) return;
    if (!projectId && !selectedProjectId) return;
    
    const targetProjectId = projectId || selectedProjectId;
    setIsLoadingEnvironments(true);
    setFetchError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(
        `${apiUrl}/api/environments?projectId=${targetProjectId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch environments: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Set environments
      if (data.environments && Array.isArray(data.environments)) {
        setEnvironments(data.environments);
        
        // Filter environments for the selected project
        const projectEnvironments = data.environments.filter(
          (env: EnvironmentOption) => env.projectId === targetProjectId
        );
        
        setFilteredEnvironments(projectEnvironments);
        
        // Set default selected environment if available
        if (projectEnvironments.length > 0) {
          setSelectedEnvironmentId(projectEnvironments[0].id);
        } else {
          setSelectedEnvironmentId('');
        }
      } else {
        setEnvironments([]);
        setFilteredEnvironments([]);
        console.warn('No environments found or invalid format');
      }
    } catch (err) {
      console.error('Error fetching environments:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch environments');
    } finally {
      setIsLoadingEnvironments(false);
    }
  };
  
  // When project selection changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchEnvironments(selectedProjectId);
    } else {
      setFilteredEnvironments([]);
      setSelectedEnvironmentId('');
    }
  }, [selectedProjectId]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }
    
    if (!secretName || !secretValue) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in the secret name and value',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedProjectId || !selectedEnvironmentId) {
      toast({
        title: 'Project and Environment required',
        description: 'Please select both a project and environment',
        variant: 'destructive',
      });
      return;
    }
    
    // Reset previous results
    setCreatedSecretId(null);
    setEncryptedData(null);
    setDecryptedValue(null);
    setIsRevealed(false);
    
    try {
      // Create the secret (encrypts and stores)
      const secretId = await createSecret({
        name: secretName,
        value: secretValue,
        type: secretType as any,
        projectId: selectedProjectId,
        environmentId: selectedEnvironmentId,
      });
      
      if (secretId) {
        setCreatedSecretId(secretId);
        toast({
          title: 'Secret created',
          description: `Secret "${secretName}" was successfully created and stored`,
        });
      }
    } catch (err) {
      console.error('Error creating secret:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Handle revealing the secret
  const handleReveal = async () => {
    if (!createdSecretId) {
      toast({
        title: 'No secret to reveal',
        description: 'Please create a secret first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Fetch the encrypted data
      const data = await fetchSecret(createdSecretId);
      
      if (data) {
        setEncryptedData(data);
        
        // Decrypt the data
        const decrypted = await decryptSecret(data);
        
        if (decrypted) {
          // Fix the type error by accessing the value property
          setDecryptedValue(decrypted.value);
          setIsRevealed(true);
        }
      }
    } catch (err) {
      console.error('Error revealing secret:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Toggle reveal/hide
  const toggleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Test Secret Encryption</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              fetchProjects();
            }} 
            disabled={isLoadingProjects}
            title="Refresh projects and environments"
          >
            {isLoadingProjects ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fetchError && (
          <Alert variant="destructive">
            <AlertDescription>
              {fetchError}
            </AlertDescription>
          </Alert>
        )}
      
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isLoadingProjects || projects.length === 0}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Environment Selection */}
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select
              value={selectedEnvironmentId}
              onValueChange={setSelectedEnvironmentId}
              disabled={isLoadingEnvironments || filteredEnvironments.length === 0 || !selectedProjectId}
            >
              <SelectTrigger id="environment">
                <SelectValue placeholder={
                  isLoadingEnvironments ? "Loading environments..." : 
                  !selectedProjectId ? "Select a project first" : 
                  filteredEnvironments.length === 0 ? "No environments available" :
                  "Select an environment"
                } />
              </SelectTrigger>
              <SelectContent>
                {filteredEnvironments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Secret Type */}
          <div className="space-y-2">
            <Label htmlFor="secretType">Secret Type</Label>
            <Select
              value={secretType}
              onValueChange={setSecretType}
            >
              <SelectTrigger id="secretType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="String">String</SelectItem>
                <SelectItem value="Password">Password</SelectItem>
                <SelectItem value="ApiKey">API Key</SelectItem>
                <SelectItem value="JSON">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Secret Name */}
          <div className="space-y-2">
            <Label htmlFor="secretName">Secret Name</Label>
            <Input
              id="secretName"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              placeholder="Enter secret name"
              required
            />
          </div>
          
          {/* Secret Value */}
          <div className="space-y-2">
            <Label htmlFor="secretValue">Secret Value</Label>
            <Textarea
              id="secretValue"
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Enter the value to encrypt"
              rows={3}
              required
            />
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              type="submit" 
              disabled={isLoading || !connected || !selectedProjectId || !selectedEnvironmentId}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Secret"
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleReveal}
              disabled={!createdSecretId || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
              ) : isRevealed ? (
                <EyeOffIcon className="h-4 w-4 mr-2" />
              ) : (
                <EyeIcon className="h-4 w-4 mr-2" />
              )}
              {isRevealed ? "Hide" : "Reveal"}
            </Button>
          </div>
        </form>
        
        {/* Results Display */}
        {createdSecretId && (
          <div className="pt-4 border-t">
            <div className="space-y-1">
              <Label>Created Secret ID:</Label>
              <div className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
                {createdSecretId}
              </div>
            </div>
          </div>
        )}
        
        {encryptedData && (
          <div className="space-y-2 border p-3 rounded-md bg-slate-50 dark:bg-slate-900">
            <Label>Encrypted Data:</Label>
            <div className="space-y-1">
              <div className="text-xs font-mono break-all">
                <span className="font-semibold">Value:</span> {encryptedData.encrypted.substring(0, 40)}...
              </div>
              <div className="text-xs font-mono break-all">
                <span className="font-semibold">IV:</span> {encryptedData.iv}
              </div>
            </div>
          </div>
        )}
        
        {decryptedValue && isRevealed && (
          <div className="space-y-2 border p-3 rounded-md bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <Label>Decrypted Value:</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleReveal}
              >
                {isRevealed ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="font-mono bg-white dark:bg-slate-800 p-2 rounded">
              {decryptedValue}
            </div>
            
            {secretValue === decryptedValue && (
              <div className="mt-2 text-green-600 dark:text-green-400 flex items-center text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Decryption successful - matches original input
              </div>
            )}
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="text-red-500 text-sm flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 