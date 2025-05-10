"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Eye, EyeOff, Copy, Download, Upload, Trash2, Lock, X } from "lucide-react"
import { SecretsTable } from "@/components/secrets-table"
import { SecretsEditor } from "@/components/secrets-editor"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
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

type Project = {
  id: string;
  name: string;
  description: string;
  environments: string[];
  teamMembers: number;
  createdAt: string;
  updatedAt: string;
}

export function ProjectDetail({ id }: { id: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentEnvironment, setCurrentEnvironment] = useState("development")
  const [isAddEnvDialogOpen, setIsAddEnvDialogOpen] = useState(false)
  const [newEnvName, setNewEnvName] = useState("")
  const [isDeleteEnvDialogOpen, setIsDeleteEnvDialogOpen] = useState(false)
  const [envToDelete, setEnvToDelete] = useState("")
  const [environments, setEnvironments] = useState<string[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data);
        if (data.environments?.length > 0) {
          setEnvironments(data.environments);
          setCurrentEnvironment(data.environments[0]);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id, toast]);

  const handleAddEnvironment = async () => {
    if (newEnvName.trim() && !environments.includes(newEnvName.toLowerCase())) {
      try {
        const newEnv = newEnvName.toLowerCase();
        const response = await fetch(`/api/projects/${id}/environments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ environment: newEnv }),
        });

        if (!response.ok) {
          throw new Error('Failed to add environment');
        }

        setEnvironments(prev => [...prev, newEnv]);
        setCurrentEnvironment(newEnv);
        setNewEnvName("");
        setIsAddEnvDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Environment has been added successfully",
        });
      } catch (error) {
        console.error('Error adding environment:', error);
        toast({
          title: "Error",
          description: "Failed to add environment",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteEnvironment = async () => {
    if (envToDelete && environments.length > 1) {
      try {
        const response = await fetch(`/api/projects/${id}/environments/${envToDelete}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete environment');
        }

        setEnvironments(prev => prev.filter(env => env !== envToDelete));
        if (currentEnvironment === envToDelete) {
          setCurrentEnvironment(environments[0]);
        }
        setIsDeleteEnvDialogOpen(false);

        toast({
          title: "Success",
          description: "Environment has been deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting environment:', error);
        toast({
          title: "Error",
          description: "Failed to delete environment",
          variant: "destructive",
        });
      }
    }
  };

  const openDeleteDialog = (env: string) => {
    setEnvToDelete(env);
    setIsDeleteEnvDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{project.description}</p>
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <span className="mr-4">Created on {new Date(project.createdAt).toLocaleDateString()}</span>
            <span className="mr-4">•</span>
            <span>{project.teamMembers} team member{project.teamMembers !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Environment selector */}
      <div className="flex flex-wrap gap-2 items-center">
        {environments.map((env) => (
          <div key={env} className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`${
                currentEnvironment === env
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-transparent hover:bg-primary/5"
              }`}
              onClick={() => setCurrentEnvironment(env)}
            >
              {env}
            </Button>
            {environments.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openDeleteDialog(env)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddEnvDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Environment
        </Button>
      </div>

      {/* Search and view toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search secrets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setShowEditor(!showEditor)}>
          {showEditor ? "Table View" : "Editor View"}
        </Button>
      </div>

      {/* Secrets view */}
      {showEditor ? (
        <SecretsEditor
          projectId={id}
          environment={currentEnvironment}
          searchQuery={searchQuery}
        />
      ) : (
        <SecretsTable
          projectId={id}
          environment={currentEnvironment}
          searchQuery={searchQuery}
        />
      )}

      {/* Add Environment Dialog */}
      <Dialog open={isAddEnvDialogOpen} onOpenChange={setIsAddEnvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Environment</DialogTitle>
            <DialogDescription>
              Enter a name for the new environment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                placeholder="e.g. staging"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEnvDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEnvironment}>Add Environment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Environment Dialog */}
      <AlertDialog open={isDeleteEnvDialogOpen} onOpenChange={setIsDeleteEnvDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {envToDelete} environment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEnvironment}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
