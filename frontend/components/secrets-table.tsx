"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useWalletEncryption } from "@/hooks/use-wallet-encryption";
import { useWallet } from "@solana/wallet-adapter-react";
import { EncryptedData } from "@/lib/crypto";

type Secret = {
  id: string;
  name: string;
  value: string;
  type: "string" | "number" | "boolean" | "json" | "reference";
  iv: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  decryptedValue?: string;
};

export function SecretsTable({
  projectId,
  environment,
  searchQuery,
}: {
  projectId: string;
  environment: string;
  searchQuery: string;
}) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for visible secrets
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
    {}
  );
  const [decryptingSecrets, setDecryptingSecrets] = useState<
    Record<string, boolean>
  >({});

  // Wallet hooks for authentication and encryption
  const { publicKey, connected } = useWallet();
  const { isInitialized, handleSignMessage, decryptData } =
    useWalletEncryption();

  // Fetch secrets from backend
  useEffect(() => {
    async function fetchSecrets() {
      if (!projectId || !environment) return;

      setLoading(true);
      try {
        // Include wallet address if available for proper authorization
        const walletAddress = publicKey ? publicKey.toBase58() : null;
        console.log(
          `Fetching secrets for project: ${projectId}, environment: ${environment}${
            walletAddress ? `, wallet: ${walletAddress}` : ""
          }`
        );

        // Fetch environment ID if needed
        let environmentId = environment;
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            environment
          )
        ) {
          // If it's not a UUID format, we need to fetch the environment ID first
          console.log(
            `Environment parameter "${environment}" is not in UUID format, fetching environment ID...`
          );
          try {
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
            const envResponse = await fetch(
              `${apiUrl}/api/environments?project_id=${projectId}`
            );
            if (!envResponse.ok) {
              throw new Error(
                `Failed to fetch environments: ${envResponse.status}`
              );
            }
            const data = await envResponse.json();
            // Get all environment IDs for this project
            const envIds = data.environments?.map((e: any) => e.id) || [];
            if (envIds.length > 0) {
              environmentId = envIds;
              console.log(
                `Found environment IDs ${envIds.join(
                  ", "
                )} for project ${projectId}`
              );
            } else {
              throw new Error(
                `Could not find any environments for project ${projectId}`
              );
            }
          } catch (err) {
            console.error("Error fetching environment IDs:", err);
            throw new Error(
              `Failed to get environment IDs: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          }
        }

        // Use API URL from environment or fallback to default
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

        // Use the new by-project endpoint if no wallet is connected
        let url;
        if (!walletAddress) {
          // Convert environmentId to array if it's not already
          const envIds = Array.isArray(environmentId)
            ? environmentId
            : [environmentId];
          url = `${apiUrl}/api/secrets/by-project?project_id=${projectId}&environment_id=${envIds.join(
            ","
          )}`;
          console.log("Using by-project endpoint:", url);
        } else {
          url = `${apiUrl}/api/secrets?project_id=${projectId}&environment_id=${environmentId}&walletAddress=${walletAddress}`;
          console.log("Using wallet-based endpoint:", url);
        }

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage =
              errorData.error || `Failed to fetch secrets: ${response.status}`;
          } catch {
            errorMessage = `Failed to fetch secrets: ${response.status} - ${errorText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`Fetched ${data.secrets?.length || 0} secrets from API`);

        // Map backend response to our Secret type
        const formattedSecrets: Secret[] =
          data.secrets?.map((secret: any) => {
            // For debugging what we're receiving from the server
            console.log("Secret from server:", secret);

            return {
              id: secret.id,
              name: secret.name,
              value: secret.encrypted_value || "", // Use encrypted_value directly
              type: secret.type?.toLowerCase() || "string",
              iv: secret.iv || "",
              createdAt: secret.created_at || new Date().toISOString(),
              updatedAt: secret.updated_at || new Date().toISOString(),
              createdBy: secret.created_by || "system",
              updatedBy: secret.updated_by || "system",
            };
          }) || [];

        console.log(
          `Loaded ${formattedSecrets.length} secrets for project: ${projectId}, environment: ${environment}`
        );
        setSecrets(formattedSecrets);
        setError(null); // Clear any previous errors on successful fetch
      } catch (err) {
        console.error("Error fetching secrets:", err);
        setError(err instanceof Error ? err.message : "Failed to load secrets");

        // Fallback to empty array
        setSecrets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSecrets();
  }, [projectId, environment, publicKey]); // Re-run when publicKey changes (wallet connected/disconnected)

  // Filter secrets based on search query
  const filteredSecrets = secrets.filter((secret) =>
    secret.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle secret visibility with wallet-based decryption
  const toggleSecretVisibility = async (secret: Secret) => {
    // If already visible, just hide it
    if (visibleSecrets[secret.id]) {
      setVisibleSecrets((prev) => ({ ...prev, [secret.id]: false }));
      return;
    }

    // Check if wallet is connected
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to view secrets",
        variant: "destructive",
      });
      return;
    }

    // If not yet decrypted, decrypt it with wallet
    try {
      setDecryptingSecrets((prev) => ({ ...prev, [secret.id]: true }));

      // If we already decrypted it before, just show it again
      if (secret.decryptedValue) {
        setVisibleSecrets((prev) => ({ ...prev, [secret.id]: true }));
        return;
      }

      // Check if wallet encryption is initialized, if not, prompt for signature
      if (!isInitialized) {
        try {
          console.log("Initializing wallet encryption with signature");
          await handleSignMessage();
          console.log("Successfully initialized wallet encryption");
        } catch (error) {
          console.error("Failed to initialize wallet encryption:", error);
          if (
            error instanceof Error &&
            error.message.includes("User rejected")
          ) {
            throw new Error(
              "You cancelled the signature request. Authentication is required to decrypt secrets."
            );
          } else {
            throw new Error("Wallet signature required to decrypt secrets");
          }
        }
      }

      // Verify that the secret has the required encrypted data
      if (!secret.value || !secret.iv) {
        console.error("Secret is missing encrypted data:", {
          id: secret.id,
          name: secret.name,
          hasValue: !!secret.value,
          valueLength: secret.value?.length || 0,
          hasIv: !!secret.iv,
          ivLength: secret.iv?.length || 0,
        });

        // If data is missing, try to fetch the full secret details
        try {
          console.log(
            `Secret ${secret.id} is missing encrypted data, attempting to fetch the full secret`
          );

          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
          const response = await fetch(
            `${apiUrl}/api/secrets/${
              secret.id
            }?walletAddress=${publicKey.toBase58()}`
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch secret: ${response.status}`);
          }

          const data = await response.json();

          if (data && data.encrypted_value && data.iv) {
            // Update the secret with the fetched data
            console.log(`Retrieved full secret data for ${secret.id}:`, {
              encryptedValueLength: data.encrypted_value.length,
              ivLength: data.iv.length,
            });

            // Update the secret in our local state
            secret.value = data.encrypted_value;
            secret.iv = data.iv;
          } else {
            throw new Error("Retrieved secret data is incomplete");
          }
        } catch (fetchError) {
          console.error("Failed to fetch full secret data:", fetchError);
          throw new Error("Could not retrieve encrypted secret data");
        }
      }

      // Decrypt the secret using the wallet encryption
      console.log(`Decrypting secret ${secret.id} (${secret.name})`);
      try {
        // Log the data we're working with to help debug issues
        console.log("Secret data to decrypt:", {
          secretId: secret.id,
          secretName: secret.name,
          valueLength: secret.value?.length,
          ivLength: secret.iv?.length,
          valueSample: secret.value?.substring(0, 20) + "...",
          ivSample: secret.iv?.substring(0, 20) + "...",
        });

        // Create EncryptedData object from the secret
        const encryptedData: EncryptedData = {
          encrypted: secret.value,
          iv: secret.iv,
          authTag: "", // This field is now part of the encrypted value
        };

        // Use the decryptData function from useWalletEncryption
        const decryptedValue = await decryptData(encryptedData);
        console.log(
          `Successfully decrypted secret ${
            secret.id
          }, value: ${decryptedValue?.substring(0, 10)}...`
        );

        // Update secret with decrypted value
        const updatedSecrets = secrets.map((s) =>
          s.id === secret.id
            ? { ...s, decryptedValue: decryptedValue || "" }
            : s
        );

        setSecrets(updatedSecrets);
        setVisibleSecrets((prev) => ({ ...prev, [secret.id]: true }));
      } catch (error) {
        console.error("Failed to decrypt secret:", error);
        let errorMessage =
          "Could not decrypt this secret. The wallet signature may be required.";

        if (error instanceof Error) {
          if (
            error.message.includes("cancelled") ||
            error.message.includes("rejected")
          ) {
            errorMessage =
              "You cancelled the signature request. Authentication is required to decrypt.";
          } else if (error.message.includes("signature verification failed")) {
            errorMessage =
              "Signature verification failed. This secret might be encrypted with a different wallet.";
          } else if (error.message.includes("key")) {
            errorMessage =
              "Encryption key error. Please reconnect your wallet and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Decryption Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDecryptingSecrets((prev) => ({ ...prev, [secret.id]: false }));
      }
    } catch (error) {
      console.error("Error in decryption process:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
      setDecryptingSecrets((prev) => ({ ...prev, [secret.id]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Secret value has been copied to clipboard.",
    });
  };

  return (
    <div className="rounded-md border">
      <div className="p-2 bg-muted/40 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize bg-background">
            {environment}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {filteredSecrets.length}{" "}
            {filteredSecrets.length === 1 ? "secret" : "secrets"}
          </span>
        </div>
        {isInitialized && (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          >
            <span className="flex items-center gap-1">Wallet Ready</span>
          </Badge>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Key</TableHead>
            <TableHead className="w-[40%]">Value</TableHead>
            <TableHead className="w-[15%]">Type</TableHead>
            <TableHead className="w-[15%]">Last Updated</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading secrets...
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredSecrets.length > 0 ? (
            filteredSecrets.map((secret) => (
              <TableRow key={secret.id}>
                <TableCell className="font-medium">{secret.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm">
                      <span
                        className={
                          secret.type === "number"
                            ? "text-green-600 dark:text-green-400"
                            : secret.type === "boolean"
                            ? "text-amber-600 dark:text-amber-400"
                            : secret.type === "json"
                            ? "text-purple-600 dark:text-purple-400"
                            : secret.type === "reference"
                            ? "text-blue-600 dark:text-blue-400"
                            : ""
                        }
                      >
                        {visibleSecrets[secret.id]
                          ? secret.decryptedValue || "Decryption failed"
                          : secret.value || "******************"}
                      </span>
                    </div>
                    {connected && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSecretVisibility(secret)}
                        disabled={decryptingSecrets[secret.id]}
                      >
                        {decryptingSecrets[secret.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : visibleSecrets[secret.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {visibleSecrets[secret.id] ? "Hide" : "Show"}{" "}
                          {secret.name}
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        // Copy content with proper feedback
                        const valueToCopy = secret.value;

                        // Show different message based on whether decrypted or encrypted value is copied
                        copyToClipboard(valueToCopy);

                        toast({
                          title: "Encrypted Value Copied",
                          description: `The encrypted value for ${secret.name} has been copied to clipboard.`,
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy {secret.name}</span>
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      secret.type === "string"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : secret.type === "number"
                        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : secret.type === "boolean"
                        ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                        : secret.type === "json"
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                        : "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                    }
                  >
                    {secret.type || "string"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(secret.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {secret.updatedBy || "system"}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(secret.name)}
                      >
                        Copy name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          copyToClipboard(secret.value);
                          toast({
                            title: "Encrypted Value Copied",
                            description: `The encrypted value for ${secret.name} has been copied to clipboard.`,
                          });
                        }}
                      >
                        Copy value
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          copyToClipboard(`${secret.name}=${secret.value}`);
                          toast({
                            title: "Encrypted Value Copied",
                            description: `The encrypted value for ${secret.name} has been copied to clipboard in .env format.`,
                          });
                        }}
                      >
                        Copy as .env
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Edit secret</DropdownMenuItem>
                      <DropdownMenuItem>View history</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Delete secret
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    No secrets found in {environment}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? `No secrets matching "${searchQuery}"`
                      : "Get started by adding your first secret"}
                  </p>
                  {!searchQuery && (
                    <Button
                      className="mt-4"
                      onClick={() => {
                        document.dispatchEvent(
                          new CustomEvent("open-add-secret-dialog", {
                            detail: { environment },
                          })
                        );
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Secret
                    </Button>
                  )}
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
