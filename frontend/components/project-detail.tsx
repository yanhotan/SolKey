"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Trash2,
  Lock,
  X,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { SecretsTable } from "@/components/secrets-table";
import { useWalletEncryption } from "@/hooks/use-wallet-encryption";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// No longer needed - using useWalletEncryption instead
// import { useSecretEncryption } from "@/hooks/use-secret-encryption"

interface Secret {
  name: string;
  locked: boolean;
}

interface EnvConfig {
  configs: number;
  secrets: Secret[];
}

interface ProjectSecrets {
  [environment: string]: EnvConfig;
}

interface Environment {
  id: string;
  name: string;
  created_at: string;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  environments: Environment[];
  members: number;
  updatedAt: string;
  status: "active" | "inactive";
  secrets: ProjectSecrets;
  owner_wallet_address: string;
}

interface MockProjects {
  [key: string]: Project;
}

export function ProjectDetail({ id }: { id: string }) {
  // Add event listener for the ADD SECRET button click from the SecretsTable
  useEffect(() => {
    const handleOpenAddSecretDialog = (event: CustomEvent) => {
      if (event.detail?.environment) {
        setIsAddSecretDialogOpen(true);
      }
    };

    document.addEventListener(
      "open-add-secret-dialog",
      handleOpenAddSecretDialog as EventListener
    );
    return () => {
      document.removeEventListener(
        "open-add-secret-dialog",
        handleOpenAddSecretDialog as EventListener
      );
    };
  }, []);

  // Mock project data - using the same data structure as projects-list
  const mockProjects: MockProjects = {
    "1": {
      id: "1",
      name: "Backend API",
      description:
        "Main backend API service with authentication and core services",
      environments: [{
        id: "default",
        name: "development",
        created_at: new Date().toISOString(),
        project_id: "1"
      }],
      members: 5,
      updatedAt: "2 hours ago",
      status: "active",
      secrets: {
        development: {
          configs: 3,
          secrets: [
            { name: "dev_api_key", locked: true },
            { name: "dev_db_url", locked: true },
            { name: "dev_jwt_secret", locked: true },
          ],
        },
        staging: {
          configs: 3,
          secrets: [
            { name: "stg_api_key", locked: true },
            { name: "stg_db_url", locked: true },
          ],
        },
        production: {
          configs: 3,
          secrets: [
            { name: "prd_api_key", locked: true },
            { name: "prd_db_url", locked: true },
          ],
        },
      },
      owner_wallet_address: "owner_wallet_address",
    },
  };

  // Initialize project with default values
  const [project, setProject] = useState<Project>({
    id: id,
    name: "Loading...",
    description: "",
    environments: [{
      id: "default",
      name: "development",
      created_at: new Date().toISOString(),
      project_id: id
    }],
    members: 0,
    updatedAt: new Date().toISOString(),
    status: "active",
    secrets: {
      development: {
        configs: 0,
        secrets: [],
      },
    },
    owner_wallet_address: "",
  });

  // Update project secrets helper function
  const updateProjectSecrets = (environment: string, secrets: Secret[]) => {
    setProject(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        secrets: {
          ...prev.secrets,
          [environment]: {
            configs: secrets.length,
            secrets: secrets,
          },
        },
      };
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [currentEnvironment, setCurrentEnvironment] = useState("development");
  const [isAddEnvDialogOpen, setIsAddEnvDialogOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [isDeleteEnvDialogOpen, setIsDeleteEnvDialogOpen] = useState(false);
  const [envToDelete, setEnvToDelete] = useState("");
  const [projectEnvironments, setProjectEnvironments] = useState<Environment[]>([{
    id: "default",
    name: "development",
    created_at: new Date().toISOString(),
    project_id: id
  }]);
  const [showEditor, setShowEditor] = useState(false);

  // Add Secret Dialog State
  const [isAddSecretDialogOpen, setIsAddSecretDialogOpen] = useState(false);
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [secretType, setSecretType] = useState<
    "string" | "number" | "boolean" | "json" | "reference"
  >("string");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [secretsRevealed, setSecretsRevealed] = useState(false);
  // Wallet integration
  const { publicKey, connected } = useWallet();
  const {
    isInitialized,
    handleSignMessage,
    encryptData,
    error: walletEncryptionError,
  } = useWalletEncryption();
  const [isSecretLoading, setIsSecretLoading] = useState(false);

  // Map environment names to their IDs
  const [environmentMap, setEnvironmentMap] = useState<Record<string, string>>(
    {}
  );
  const [environmentsLoaded, setEnvironmentsLoaded] = useState(false);
  useEffect(() => {
    if (project?.environments && project.environments.length > 0) {
      setProjectEnvironments(project.environments);
      setCurrentEnvironment(project.environments[0].name);
    }
  }, [project?.id, JSON.stringify(project?.environments)]);
  // Fetch environment IDs on load
  useEffect(() => {
    async function fetchEnvironmentIds() {
      if (!id) return;

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(
          `${apiUrl}/api/environments?project_id=${id}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch environments: ${response.status}`);
        }

        const data = await response.json();
        console.log(
          `Fetched ${data.environments?.length || 0} environments with IDs`
        );

        if (!data.environments || data.environments.length === 0) {
          console.warn("No environments found for this project");
          toast({
            title: "No Environments Found",
            description:
              "No environments found for this project. Please create at least one environment.",
            variant: "destructive",
          });
          setEnvironmentsLoaded(true); // Mark as loaded even if empty
          return;
        }

        // Create a map of environment names to their IDs
        const envMap: Record<string, string> = {};
        data.environments?.forEach((env: any) => {
          envMap[env.name] = env.id;
        });

        console.log("Environment mapping:", envMap);
        setEnvironmentMap(envMap);
        setEnvironmentsLoaded(true);
      } catch (err) {
        console.error("Error fetching environment IDs:", err);
        toast({
          title: "Error Loading Environments",
          description:
            "Could not load environment data. Some features may be limited.",
          variant: "destructive",
        });

        // Automatically retry after a delay
        setTimeout(() => {
          console.log("Retrying environment ID fetch...");
          fetchEnvironmentIds();
        }, 3000);
      }
    }

    fetchEnvironmentIds();
  }, [id]);

  // Fetch project secrets on load
  useEffect(() => {
    async function fetchProjectSecrets() {
      if (!currentEnvironment || !id) return;

      try {
        // Only include wallet address if connected
        const walletAddress = publicKey ? publicKey.toBase58() : null;
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || '/api';
        // Get environment ID from the map
        let environmentId = environmentMap[currentEnvironment];

        // If environment ID is missing, try to refresh it
        if (!environmentId && environmentsLoaded) {
          console.warn(
            `Environment ID not found for "${currentEnvironment}" in map:`,
            environmentMap
          );

          try {
            // Attempt an immediate reload of environment data
            const envResponse = await fetch(
              `${apiUrl}/api/environments?project_id=${id}`
            );
            if (envResponse.ok) {
              const envData = await envResponse.json();
              if (envData.environments?.length > 0) {
                const newEnvMap: Record<string, string> = {};
                envData.environments.forEach((env: any) => {
                  newEnvMap[env.name] = env.id;
                });
                setEnvironmentMap(newEnvMap);

                // Check again if we have the environment ID now
                if (newEnvMap[currentEnvironment]) {
                  console.log(
                    `Successfully refreshed environment IDs and found ID for ${currentEnvironment}`
                  );
                  // Update our local variable with the new ID
                  environmentId = newEnvMap[currentEnvironment];
                }
              }
            }
          } catch (refreshError) {
            console.error("Failed to refresh environment IDs:", refreshError);
          }
        }

        // Build URL with proper parameters - use environment ID if available, otherwise use name as fallback
        const envParam = environmentId || currentEnvironment;
        if (!environmentId) {
          console.warn(
            `Using environment name instead of ID for API call. This may cause errors if the API expects a UUID.`
          );
        }

        // Use the new by-project endpoint if no wallet is connected
        let url;
        if (!walletAddress) {
          url = `${apiUrl}/api/secrets/by-project?project_id=${id}&environment_id=${envParam}`;
        } else {
          url = `${apiUrl}/api/secrets?project_id=${id}&environment_id=${envParam}&walletAddress=${walletAddress}`;
        }

        console.log(
          `Fetching secrets for project ${id} in ${currentEnvironment} environment (ID: ${
            environmentId || "unknown"
          })`
        );
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch secrets: ${response.status}`);
        }

        const data = await response.json();
        console.log(
          `Fetched ${
            data.secrets?.length || 0
          } project secrets for ${currentEnvironment}`
        );

        // Update the project secrets with the fetched data
        const updatedProject = { ...project };
        if (!updatedProject.secrets[currentEnvironment]) {
          updatedProject.secrets[currentEnvironment] = {
            configs: 0,
            secrets: [],
          };
        }

        // Update the secrets list with the fetched data
        updatedProject.secrets[currentEnvironment].secrets = data.secrets.map(
          (secret: any) => ({
            name: secret.name,
            locked: true,
          })
        );
        updatedProject.secrets[currentEnvironment].configs =
          data.secrets.length;

        // Update the mock projects data
        mockProjects[id] = updatedProject;
      } catch (err) {
        console.error("Error fetching project secrets:", err);
        // Don't show error toast here as the SecretsTable will handle error display
      }
    }

    // Only fetch if environments are loaded or after 3 seconds (fallback)
    if (environmentsLoaded || Object.keys(environmentMap).length > 0) {
      fetchProjectSecrets();
    }
  }, [currentEnvironment, id, publicKey, environmentMap, environmentsLoaded]);

  // Connect wallet if not initialized when trying to show secrets
  const handleRevealSecrets = async () => {
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first to access secrets",
        variant: "destructive",
      });
      return;
    }
    if (!isInitialized) {
      try {
        console.log("Initializing wallet encryption for revealing secrets");
        await handleSignMessage();
        setSecretsRevealed(true);
        toast({
          title: "Wallet Authentication Successful",
          description:
            "Your secrets can now be decrypted with your wallet signature",
        });
      } catch (error) {
        console.error("Failed to authenticate with wallet:", error);
        toast({
          title: "Authentication Failed",
          description:
            error instanceof Error
              ? error.message.includes("User rejected")
                ? "You cancelled the signature request. Authentication is required to view secrets."
                : error.message
              : "Could not authenticate with wallet",
          variant: "destructive",
        });
      }
    } else {
      // We already have the key, just toggle the revealed state
      setSecretsRevealed(!secretsRevealed);
    }
  };
  const handleAddSecret = async () => {
    if (!currentEnvironment || !secretName || !secretValue) return;

    try {
      setIsEncrypting(true);
      setIsSecretLoading(true);

      // Check if wallet is connected
      if (!connected || !publicKey) {
        toast({
          title: "Wallet Connection Required",
          description: "Please connect your wallet first to encrypt secrets",
          variant: "destructive",
        });
        return;
      }

      // Check if wallet is initialized, if not prompt for signature
      if (!isInitialized) {
        try {
          console.log("Initializing wallet encryption for secret creation");
          await handleSignMessage();
          console.log("Successfully initialized wallet encryption");
        } catch (error) {
          console.error("Failed to initialize wallet encryption:", error);
          toast({
            title: "Authentication Required",
            description:
              error instanceof Error
                ? error.message
                : "You need to sign with your wallet to add encrypted secrets",
            variant: "destructive",
          });
          return;
        }
      }

      // Map UI type to SecretType from useSecretEncryption hook
      // Ensure first letter is capitalized for backend compatibility
      const mappedType =
        secretType.charAt(0).toUpperCase() + secretType.slice(1);

      // Encrypt the secret data using wallet encryption - same as in encryption-test.tsx
      const encryptedData = await encryptData(secretValue);
      console.log("ENCRYPTION PROCESS COMPLETE --------------------------");
      console.log(" Encrypted data to send:", {
        encrypted_length: encryptedData.encrypted.length,
        iv_length: encryptedData.iv.length,
        encrypted_sample: encryptedData.encrypted.substring(0, 20) + "...",
        iv_sample: encryptedData.iv.substring(0, 20) + "...",
      });

      // Get environment ID from the map - this is crucial as backend expects UUID, not name
      let environmentId = environmentMap[currentEnvironment];

      // If environment ID is missing, try to refresh it
      if (!environmentId) {
        console.error(
          `Environment ID not found for "${currentEnvironment}". Attempting to refresh environment data...`
        );
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || '/api';

        try {
          // Attempt an immediate reload of environment data
          const response = await fetch(
            `${apiUrl}/api/environments?project_id=${id}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.environments?.length > 0) {
              const newEnvMap: Record<string, string> = {};
              data.environments.forEach((env: any) => {
                newEnvMap[env.name] = env.id;
              });
              setEnvironmentMap(newEnvMap);

              // Check again if we have the environment ID now
              if (newEnvMap[currentEnvironment]) {
                console.log(
                  `Successfully refreshed environment IDs and found ID for ${currentEnvironment}`
                );
                // Update our local variable with the new ID
                environmentId = newEnvMap[currentEnvironment];
              }
            }
          }
        } catch (refreshError) {
          console.error("Failed to refresh environment IDs:", refreshError);
        }
      }

      // Final check if we have an environment ID
      if (!environmentId) {
        toast({
          title: "Environment Not Found",
          description:
            "Could not find the environment ID. Please try again or select a different environment.",
          variant: "destructive",
        });
        return;
      }

      console.log(
        `Using environment ID ${environmentId} for environment "${currentEnvironment}"`
      );

      // Prepare data for API following backend requirements
      const secretData = {
        // Secret data
        name: secretName,
        type: mappedType,
        encrypted_value: encryptedData.encrypted,
        iv: encryptedData.iv.substring(0, 24), // Ensure IV fits in VARCHAR(32) when hex-encoded
        project_id: id,
        environment_id: environmentId, // Use the UUID instead of the name

        // Secret key data - required by the backend
        wallet_address: publicKey.toBase58(),
        // Required fields for the secret_keys table - provide valid formats
        encrypted_aes_key: "wallet-encrypted",
        nonce: "wallet-encrypted",
        ephemeral_public_key: "wallet-encrypted",
      };

      // Make sure the IV is in correct hex format as expected by backend
      if (!/^[0-9a-f]+$/i.test(secretData.iv)) {
        console.warn("IV is not in proper hex format, converting...");
        // Convert to proper hex if needed
        const ivBytes = new TextEncoder().encode(secretData.iv);
        const ivHex = Array.from(ivBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        secretData.iv = ivHex.substring(0, 24);
      }
      // Send to backend for storage
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      console.log(" Sending to API:", {
        url: `${apiUrl}/api/secrets`,
        method: "POST",
        dataKeys: Object.keys(secretData),
        bodyPreview: {
          name: secretData.name,
          type: secretData.type,
          encrypted_value_length: secretData.encrypted_value.length,
          iv_length: secretData.iv.length,
          project_id: secretData.project_id,
          environment_id: secretData.environment_id,
          wallet_address: secretData.wallet_address,
        },
      });

      const response = await fetch(`${apiUrl}/api/secrets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(secretData),
      });

      if (!response.ok) {
        // Try to extract the error details from the response
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
          console.error("Server error response:", errorData);
        } catch (e) {
          console.error("Server error (raw):", errorText);
          errorData = { error: errorText || "Unknown error" };
        }

        throw new Error(
          errorData.error || `Failed to create secret: ${response.status}`
        );
      }

      const result = await response.json();
      const secretId = result.id;
      if (secretId) {
        // Update local state
        const updatedProject = { ...project };
        if (!updatedProject.secrets[currentEnvironment]) {
          updatedProject.secrets[currentEnvironment] = {
            configs: 0,
            secrets: [],
          };
        }

        updatedProject.secrets[currentEnvironment].secrets.push({
          name: secretName,
          locked: true,
        });
        updatedProject.secrets[currentEnvironment].configs += 1;

        // Refresh the UI
        mockProjects[id] = updatedProject;
        // Reset the form
        setSecretName("");
        setSecretValue("");
        setSecretType("string");

        // Close the dialog automatically after successful add
        setIsAddSecretDialogOpen(false);

        toast({
          title: "Secret Added",
          description: `Secret ${secretName} has been encrypted with your wallet and added to ${currentEnvironment} environment.`,
        });
      }
    } catch (error) {
      console.error("Error saving secret:", error);
      let errorMessage = "Failed to save secret. Please try again.";

      if (error instanceof Error) {
        console.error("Detailed error:", error.stack);

        if (error.message.includes("User declined")) {
          errorMessage =
            "You declined to sign the message. Wallet signature is required for encryption.";
        } else if (error.message.includes("wallet")) {
          errorMessage = error.message;
        } else if (error.message.includes("already exists")) {
          errorMessage = `A secret named "${secretName}" already exists in this environment.`;
        } else if (
          error.message.includes("invalid input syntax for type uuid")
        ) {
          // Handle the specific UUID format error we were seeing
          errorMessage =
            "Invalid environment format. Please reload the page to refresh environment data.";
          console.error(
            "UUID format error - environment_id is not in UUID format:",
            currentEnvironment
          );
          console.error("Environment map:", environmentMap);
        } else if (error.message.includes("Foreign key constraint")) {
          // Handle foreign key constraint issues
          if (error.message.includes("project_id")) {
            errorMessage =
              "Invalid project ID. Please check your project selection.";
          } else if (error.message.includes("environment_id")) {
            errorMessage =
              "Invalid environment ID. Please check your environment selection.";
          } else {
            errorMessage = "Database constraint error: " + error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Encryption Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEncrypting(false);
      setIsSecretLoading(false);
    }
  };

  const handleAddEnvironment = () => {
    if (newEnvName.trim() && !projectEnvironments.some(env => env.name === newEnvName.toLowerCase())) {
      const newEnv: Environment = {
        id: `temp-${Date.now()}`,
        name: newEnvName.toLowerCase(),
        created_at: new Date().toISOString(),
        project_id: id
      };
      setProjectEnvironments([...projectEnvironments, newEnv]);
      setCurrentEnvironment(newEnv.name);
      setNewEnvName("");
      setIsAddEnvDialogOpen(false);
    }
  };

  const handleDeleteEnvironment = () => {
    if (envToDelete && projectEnvironments.length > 1) {
      const newEnvironments = projectEnvironments.filter((env) => env.name !== envToDelete);
      setProjectEnvironments(newEnvironments);
      if (currentEnvironment === envToDelete) {
        setCurrentEnvironment(newEnvironments[0].name);
      }
      setIsDeleteEnvDialogOpen(false);
    }
  };

  const openDeleteDialog = (env: string) => {
    setEnvToDelete(env);
    setIsDeleteEnvDialogOpen(true);
  };

  // Function to get environment button styling
  const getEnvironmentButtonClass = (envName: string) => {
    if (currentEnvironment === envName) {
      switch (envName) {
        case "development":
          return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-300";
        case "staging":
          return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-300";
        case "production":
          return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-300";
        default:
          return "bg-secondary text-secondary-foreground";
      }
    }
    return "bg-transparent";
  };

  // Function to get environment badge styling
  const getEnvironmentBadgeClass = (envName: string) => {
    switch (envName) {
      case "dev":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
      case "dev_personal":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400";
      case "stg":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
      case "prd":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400";
      default:
        return "";
    }
  };
  if (!currentEnvironment) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading project details...
      </div>
    );
  }

  // Show loading state if environment IDs are not loaded yet
  if (!environmentsLoaded) {
    console.log(
      "Environment IDs not loaded yet - waiting before allowing secret operations"
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1">
          {projectEnvironments.map((env, index) => (
            <div key={`${env.id}-${index}`} className="relative group">
              <Button
                variant="outline"
                className={`capitalize ${getEnvironmentButtonClass(env.name)}`}
                onClick={() => setCurrentEnvironment(env.name)}
              >
                {env.name}
              </Button>
              {projectEnvironments.length > 1 && env.name !== "production" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 absolute -top-2 -right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => openDeleteDialog(env.name)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Delete environment</span>
                </Button>
              )}
            </div>
          ))}
          <Dialog
            open={isAddEnvDialogOpen}
            onOpenChange={setIsAddEnvDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add environment</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Environment</DialogTitle>
                <DialogDescription>
                  Create a new environment to manage your secrets. Environment
                  names should be lowercase and contain only letters, numbers,
                  and underscores.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="env-name">Environment Name</Label>
                  <Input
                    id="env-name"
                    placeholder="e.g., integration, testing"
                    value={newEnvName}
                    onChange={(e) =>
                      setNewEnvName(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddEnvDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEnvironment}
                  disabled={
                    !newEnvName.trim() ||
                    projectEnvironments.some(env => env.name === newEnvName.toLowerCase())
                  }
                >
                  Add Environment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex w-full flex-1 items-center gap-2 sm:w-auto sm:justify-end">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search secrets..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog
            open={isAddSecretDialogOpen}
            onOpenChange={setIsAddSecretDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Secret
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Secret</DialogTitle>
                <DialogDescription>
                  Add a new secret key to your {currentEnvironment} environment.
                  All secrets are encrypted with your wallet signature.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="secret-name">Secret Name</Label>
                  <Input
                    id="secret-name"
                    placeholder="e.g., API_KEY, DATABASE_URL"
                    value={secretName}
                    onChange={(e) => setSecretName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret-value">Secret Value</Label>
                  <Input
                    id="secret-value"
                    placeholder="Enter the secret value"
                    value={secretValue}
                    type="password"
                    onChange={(e) => setSecretValue(e.target.value)}
                  />
                  {/* Show visibility toggle button for secret value here if needed */}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret-type">Secret Type</Label>
                  <Select
                    defaultValue="string"
                    onValueChange={(
                      value:
                        | "string"
                        | "number"
                        | "boolean"
                        | "json"
                        | "reference"
                    ) => setSecretType(value)}
                  >
                    <SelectTrigger id="secret-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="reference">Reference</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls how the secret is displayed and validated
                  </p>
                </div>

                {!connected && (
                  <div className="border p-3 rounded-md bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                        />
                      </svg>
                      Wallet connection required for encrypted secrets
                    </p>
                  </div>
                )}

                {connected && !isInitialized && (
                  <div className="border p-3 rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Wallet signature required for encryption
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await handleSignMessage();
                            toast({
                              title: "Wallet Authenticated",
                              description:
                                "You can now encrypt and decrypt secrets",
                            });
                          } catch (error) {
                            toast({
                              title: "Authentication Failed",
                              description:
                                error instanceof Error
                                  ? error.message
                                  : "Failed to sign message",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Sign Message
                      </Button>
                    </div>
                  </div>
                )}

                {isInitialized && (
                  <div className="border p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                    <div className="text-green-500 flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Wallet ready for encryption
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddSecretDialogOpen(false);
                    setSecretName("");
                    setSecretValue("");
                    setSecretType("string");
                  }}
                >
                  Cancel
                </Button>{" "}
                <Button
                  onClick={handleAddSecret}
                  disabled={
                    isEncrypting ||
                    !secretName ||
                    !secretValue ||
                    !connected ||
                    !environmentsLoaded
                  }
                >
                  {isEncrypting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                      Encrypting...
                    </>
                  ) : environmentsLoaded ? (
                    "Add Secret"
                  ) : (
                    "Loading Environments..."
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AlertDialog
        open={isDeleteEnvDialogOpen}
        onOpenChange={setIsDeleteEnvDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{envToDelete}" environment?
              This action cannot be undone and all secrets in this environment
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnvironment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4">
        {/* Environment configs */}
        <div className="grid gap-4">
          {project.secrets[currentEnvironment]?.secrets.map((secret, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Lock
                      className={`h-4 w-4 ${
                        secretsRevealed
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-mono text-sm">{secret.name}</span>

                    {secretsRevealed && (
                      <div className="ml-4 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                        <span className="font-mono text-xs text-green-700 dark:text-green-400">
                          {secret.name.includes("api")
                            ? "sk_test_51Jg...X9b"
                            : secret.name.includes("db")
                            ? "postgres://user:pass@host:5432/db"
                            : secret.name.includes("jwt")
                            ? "e4d15b252...12ab"
                            : "decrypted-value-here"}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={getEnvironmentBadgeClass(secret.name)}
                  >
                    {secretsRevealed ? "Revealed" : "Hidden"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showEditor ? (
          <div className="mt-4">{/* Editor placeholder */}</div>
        ) : (
          <div className="mt-4">
            <h3 className="mb-4 font-medium">Project Secrets</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevealSecrets}
                disabled={!connected}
              >
                <Eye className="mr-2 h-4 w-4" />
                Reveal All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSecretsRevealed(false)}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Hide All
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy as .env
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </Button>
            </div>

            <div className="mt-6">
              <SecretsTable
                projectId={id}
                environment={currentEnvironment}
                searchQuery={searchQuery}
                projectOwner={mockProjects[id]?.owner_wallet_address || ""}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
