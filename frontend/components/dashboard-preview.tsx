"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Download,
  MoreHorizontal,
  Lock,
  GitBranch,
  Users,
  Settings,
  Bell,
  Home,
  FolderKanban,
  Activity,
  Key,
} from "lucide-react"

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("development")
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Sample secrets data
  const secrets = [
    {
      id: "1",
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      type: "string",
    },
    {
      id: "2",
      key: "NEXT_PUBLIC_SUPABASE_URL",
      value: "https://abcdefghijklm.supabase.co",
      type: "string",
    },
    {
      id: "3",
      key: "DEBUG_MODE",
      value: "true",
      type: "boolean",
    },
    {
      id: "4",
      key: "PORT",
      value: "3000",
      type: "number",
    },
  ]

  return (
    <div className="w-full h-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="hidden md:block md:w-64 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6">
              <img
                src="/images/solsecure_logo.png"
                alt="SolSecure Logo"
                className="h-6 w-6"
              />
            </div>
            <span className="font-bold bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[size:200%_auto]">SolSecure</span>
          </div>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <div className="w-full rounded-lg bg-muted/30 pl-8 py-2 px-3 text-sm">Search...</div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Settings className="h-4 w-4" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
            <span className="text-xs font-medium">JD</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[500px]">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r bg-background">
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {[
                { icon: <Home className="h-4 w-4" />, label: "Dashboard" },
                { icon: <FolderKanban className="h-4 w-4" />, label: "Projects", active: true },
                { icon: <Users className="h-4 w-4" />, label: "Team" },
                { icon: <Activity className="h-4 w-4" />, label: "Activity" },
                { icon: <Key className="h-4 w-4" />, label: "Tokens" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    item.active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Backend API</h1>
              <Badge>Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Main backend API service with authentication and core services
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span>3 environments</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>5 team members</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b">
              <div
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium",
                  activeTab === "secrets" ? "border-primary text-primary" : "border-transparent text-muted-foreground",
                )}
              >
                Secrets
              </div>
              <div className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground">
                Settings
              </div>
              <div className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground">
                Team
              </div>
              <div className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground">
                Activity
              </div>
            </div>
          </div>          {/* Environment tabs */}
          <div className="mb-6 flex gap-2">
            {["development", "staging", "production"].map((env) => (
              <div
                key={env}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border",
                  activeTab === env 
                    ? env === "development"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-300"
                      : env === "staging"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-300"
                      : env === "production"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-300"
                      : "bg-secondary text-secondary-foreground"
                    : "bg-muted/50 text-muted-foreground border-transparent"
                )}
                onClick={() => setActiveTab(env)}
              >
                <span className="capitalize">{env}</span>
                <Badge variant="outline" className="ml-1 bg-background">
                  {env === "development" ? 2 : 1}
                </Badge>
              </div>
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Environment configs */}
          <div className="mb-6 grid gap-4">
            <div className="rounded-md border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {activeTab === "development" ? "dev" : activeTab === "staging" ? "stg" : "prd"}
                </span>
              </div>
              <Badge variant="outline" className="bg-muted/50">
                Locked
              </Badge>
            </div>
            {activeTab === "development" && (
              <div className="rounded-md border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">dev_personal</span>
                </div>
                <Badge variant="outline" className="bg-muted/50">
                  Locked
                </Badge>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Reveal All</span>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              <span>Hide All</span>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium flex items-center gap-1">
              <Copy className="h-3 w-3" />
              <span>Copy as .env</span>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>Export</span>
            </div>
          </div>

          {/* Secrets table */}
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 border-b p-4 text-xs font-medium text-muted-foreground">
              <div className="col-span-3">Key</div>
              <div className="col-span-6">Value</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1"></div>
            </div>
            {secrets.map((secret) => (
              <div key={secret.id} className="grid grid-cols-12 gap-4 border-b p-4 text-sm">
                <div className="col-span-3 font-medium font-mono">{secret.key}</div>                <div className="col-span-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="font-mono text-xs">
                      {visibleSecrets[secret.id] ? (
                        secret.value
                      ) : (
                        <span className="text-muted-foreground">•••••••••••••••</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50 cursor-pointer"
                        onClick={() => toggleSecretVisibility(secret.id)}
                      >
                        {visibleSecrets[secret.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50 cursor-pointer">
                        <Copy className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      secret.type === "string"
                        ? "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                        : secret.type === "number"
                          ? "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                          : "border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
                    )}
                  >
                    {secret.type}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50 cursor-pointer">
                    <MoreHorizontal className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
