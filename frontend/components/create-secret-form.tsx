"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSecretEncryption } from "@/hooks/use-secret-encryption"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  value: z.string().min(1, {
    message: "Secret value is required",
  }),
  type: z.enum(["String", "Password", "ApiKey"], {
    required_error: "Please select a secret type.",
  }),
  projectId: z.string().optional(),
  environmentId: z.string().optional(),
})

export function CreateSecretForm() {
  const { publicKey, connected } = useWallet();
  const { createSecret, isLoading, error } = useSecretEncryption();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      value: "",
      type: "String",
      projectId: "default",
      environmentId: "default",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a secret",
        variant: "destructive",
      })
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create the secret using our new hook
      const secretId = await createSecret({
        name: values.name,
        value: values.value,
        type: values.type as "String" | "Password" | "ApiKey",
        projectId: values.projectId,
        environmentId: values.environmentId,
      });
      
      if (secretId) {
        toast({
          title: "Secret created",
          description: "Your secret has been created successfully",
        })
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        throw new Error("Failed to create secret");
      }
    } catch (err) {
      console.error("Error creating secret:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create secret",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret Name</FormLabel>
              <FormControl>
                <Input placeholder="API Key Name" {...field} />
              </FormControl>
              <FormDescription>
                A friendly name for your secret.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret Value</FormLabel>
              <FormControl>
                <Input placeholder="Secret value" {...field} type="password" />
              </FormControl>
              <FormDescription>
                The value will be encrypted before being stored.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="String">Text</SelectItem>
                  <SelectItem value="Password">Password</SelectItem>
                  <SelectItem value="ApiKey">API Key</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Type determines how the secret is displayed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <Button type="submit" disabled={submitting || isLoading || !connected}>
          {(submitting || isLoading) ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Secret"
          )}
        </Button>
      </form>
    </Form>
  )
} 