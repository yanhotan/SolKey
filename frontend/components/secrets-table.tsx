"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, MoreHorizontal, Clock, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Secret = {
  id: string
  key: string
  value: string
  type: "string" | "number" | "boolean" | "json" | "reference"
  updatedAt: string
  updatedBy: string
}

export function SecretsTable({ environment, searchQuery }: { environment: string; searchQuery: string }) {
  // Sample secrets data based on environment
  const secretsByEnvironment: Record<string, Secret[]> = {
    development: [
      {
        id: "1",
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        type: "string",
        updatedAt: "2 hours ago",
        updatedBy: "John Doe",
      },
      {
        id: "2",
        key: "NEXT_PUBLIC_SUPABASE_URL",
        value: "https://abcdefghijklm.supabase.co",
        type: "string",
        updatedAt: "2 hours ago",
        updatedBy: "John Doe",
      },
      {
        id: "3",
        key: "DEBUG_MODE",
        value: "true",
        type: "boolean",
        updatedAt: "3 days ago",
        updatedBy: "Mike Johnson",
      },
      {
        id: "4",
        key: "PORT",
        value: "3000",
        type: "number",
        updatedAt: "1 week ago",
        updatedBy: "Lisa Chen",
      },
    ],
    staging: [
      {
        id: "5",
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        type: "string",
        updatedAt: "1 day ago",
        updatedBy: "Sarah Kim",
      },
      {
        id: "6",
        key: "NEXT_PUBLIC_SUPABASE_URL",
        value: "https://stgnopqrstuv.supabase.co",
        type: "string",
        updatedAt: "1 day ago",
        updatedBy: "Sarah Kim",
      },
    ],
    production: [
      {
        id: "7",
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        type: "string",
        updatedAt: "5 days ago",
        updatedBy: "John Doe",
      },
      {
        id: "8",
        key: "NEXT_PUBLIC_SUPABASE_URL",
        value: "https://prodwxyz123456.supabase.co",
        type: "string",
        updatedAt: "5 days ago",
        updatedBy: "John Doe",
      },
    ],
  }

  const secrets = secretsByEnvironment[environment] || []

  // Filter secrets based on search query
  const filteredSecrets = secrets.filter((secret) => secret.key.toLowerCase().includes(searchQuery.toLowerCase()))

  // State for visible secrets
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className="rounded-md border">
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
          {filteredSecrets.map((secret) => (
            <TableRow key={secret.id}>
              <TableCell className="font-medium">{secret.key}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm">
                    {visibleSecrets[secret.id] ? (
                      secret.value
                    ) : (
                      <span className="text-muted-foreground">••••••••••••••••••••••••••</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSecretVisibility(secret.id)}
                  >
                    {visibleSecrets[secret.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">
                      {visibleSecrets[secret.id] ? "Hide" : "Show"} {secret.key}
                    </span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(secret.value)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy {secret.key}</span>
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
                  {secret.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{secret.updatedAt}</span>
                </div>
                <div className="text-xs text-muted-foreground">by {secret.updatedBy}</div>
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
                    <DropdownMenuItem onClick={() => copyToClipboard(secret.key)}>Copy key</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(secret.value)}>Copy value</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(`${secret.key}=${secret.value}`)}>
                      Copy as .env
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit secret</DropdownMenuItem>
                    <DropdownMenuItem>View history</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete secret</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filteredSecrets.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium">No secrets found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? `No secrets matching "${searchQuery}"` : "Get started by adding your first secret"}
                  </p>
                  {!searchQuery && (
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Secret
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
