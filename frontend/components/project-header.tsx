"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GitBranch, Users, Calendar } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description?: string
  environments: unknown[]
  team: unknown[]
  createdAt: string
}

export function ProjectHeader({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Check localStorage first
        const cached = localStorage.getItem(`project_${id}`);
        if (cached) {
          setProject(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
        
        // If not in cache, fetch from API
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        
        // Cache the result
        localStorage.setItem(`project_${id}`, JSON.stringify(data));
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div>Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <div>Failed to load project details</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to projects</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <Badge>Active</Badge>
        </div>
        <p className="text-muted-foreground">{project.description}</p>
        <div className="flex flex-wrap gap-4 pt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            <span>{project.environments?.length || 0} environments</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.team?.length || 0} team members</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created on {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
