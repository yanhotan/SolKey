"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Eye, EyeOff, Copy, Download, Upload, Trash2, Lock, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Secret {
  name: string
  locked: boolean
}

interface EnvConfig {
  configs: number
  secrets: Secret[]
}

interface ProjectSecrets {
  [key: string]: EnvConfig
}

interface Project {
  id: string
  name: string
  description: string
  environments: string[]
  members: number
  updatedAt: string
  status: 'active' | 'inactive'
  secrets: ProjectSecrets
}

interface MockProjects {
  [key: string]: Project
}

export function ProjectDetail({ id }: { id: string }) {
  // Mock project data - using the same data structure as projects-list
  const mockProjects: MockProjects = {
    "1": {
      id: "1",
      name: "Backend API",
      description: "Main backend API service with authentication and core services",
      environments: ["development", "staging", "production"],
      members: 5,
      updatedAt: "2 hours ago",
      status: "active",
      secrets: {
        development: {
          configs: 3,
          secrets: [
            { name: "dev_api_key", locked: true },
            { name: "dev_db_url", locked: true },
            { name: "dev_jwt_secret", locked: true }
          ]
        },
        staging: {
          configs: 3,
          secrets: [
            { name: "stg_api_key", locked: true },
            { name: "stg_db_url", locked: true }
          ]
        },
        production: {
          configs: 3,
          secrets: [
            { name: "prd_api_key", locked: true },
            { name: "prd_db_url", locked: true }
          ]
        }
      }
    }
  }

  const project = mockProjects[id] || {
    id,
    name: "New Project",
    description: "Project details not found",
    environments: ["development"],
    members: 0,
    updatedAt: "Unknown",
    status: "inactive" as const,
    secrets: {
      development: {
        configs: 0,
        secrets: []
      }
    }
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [currentEnvironment, setCurrentEnvironment] = useState("")
  const [isAddEnvDialogOpen, setIsAddEnvDialogOpen] = useState(false)
  const [newEnvName, setNewEnvName] = useState("")
  const [isDeleteEnvDialogOpen, setIsDeleteEnvDialogOpen] = useState(false)
  const [envToDelete, setEnvToDelete] = useState("")
  const [environments, setEnvironments] = useState<string[]>([])
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (project.environments && project.environments.length > 0) {
      setEnvironments(project.environments)
      setCurrentEnvironment(project.environments[0])
    }
  }, [project.id, project.environments])

  const handleAddEnvironment = () => {
    if (newEnvName.trim() && !environments.includes(newEnvName.toLowerCase())) {
      setEnvironments([...environments, newEnvName.toLowerCase()])
      setCurrentEnvironment(newEnvName.toLowerCase())
      setNewEnvName("")
      setIsAddEnvDialogOpen(false)
    }
  }

  const handleDeleteEnvironment = () => {
    if (envToDelete && environments.length > 1) {
      const newEnvironments = environments.filter((env) => env !== envToDelete)
      setEnvironments(newEnvironments)
      if (currentEnvironment === envToDelete) {
        setCurrentEnvironment(newEnvironments[0])
      }
      setIsDeleteEnvDialogOpen(false)
    }
  }

  const openDeleteDialog = (env: string) => {
    setEnvToDelete(env)
    setIsDeleteEnvDialogOpen(true)
  }

  // Function to get environment button styling
  const getEnvironmentButtonClass = (env: string) => {
    if (currentEnvironment === env) {
      switch (env) {
        case "development":
          return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-300"
        case "staging":
          return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-300"
        case "production":
          return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-300"
        default:
          return "bg-secondary text-secondary-foreground"
      }
    }
    return "bg-transparent"
  }

  // Function to get environment badge styling
  const getEnvironmentBadgeClass = (env: string) => {
    switch (env) {
      case "dev":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
      case "dev_personal":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
      case "stg":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
      case "prd":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
      default:
        return ""
    }
  }

  if (!currentEnvironment) {
    return <div className="p-8 text-center text-muted-foreground">Loading project details...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {environments.map((env) => (
            <div key={env} className="relative group">
              <Button
                variant="outline"
                className={`capitalize ${getEnvironmentButtonClass(env)}`}
                onClick={() => setCurrentEnvironment(env)}
              >
                {env}
                <Badge variant="outline" className="ml-2 bg-background">
                  {project.secrets[env]?.configs || 0}
                </Badge>
              </Button>
              {environments.length > 1 && env !== "production" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 absolute -top-2 -right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => openDeleteDialog(env)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Delete environment</span>
                </Button>
              )}
            </div>
          ))}
          <Dialog open={isAddEnvDialogOpen} onOpenChange={setIsAddEnvDialogOpen}>
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
                  Create a new environment to manage your secrets. Environment names should be lowercase and contain
                  only letters, numbers, and underscores.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="env-name">Environment Name</Label>
                  <Input
                    id="env-name"
                    placeholder="e.g., integration, testing"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddEnvDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEnvironment}
                  disabled={!newEnvName.trim() || environments.includes(newEnvName.toLowerCase())}
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
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Secret
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteEnvDialogOpen} onOpenChange={setIsDeleteEnvDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{envToDelete}" environment? This action cannot be undone and all
              secrets in this environment will be permanently deleted.
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
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{secret.name}</span>
                  </div>
                  <Badge variant="outline" className={getEnvironmentBadgeClass(secret.name)}>
                    {secret.locked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" className="flex h-16 items-center justify-center border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add Config
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Reveal All
          </Button>
          <Button variant="outline" size="sm">
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
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        </div>

        {/* {showEditor ? (
          <SecretsEditor environment={currentEnvironment} />
        ) : (
          <div className="mt-4">
            <h3 className="mb-4 font-medium">Active Secrets ({currentEnvironment})</h3>
            <SecretsTable environment={currentEnvironment} searchQuery={searchQuery} />
          </div>
        )} */}
      </div>
    </div>
  )
}
