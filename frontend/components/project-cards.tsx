"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Users, Plus, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Mock data for projects
const mockProjects = [
  {
    id: "1",
    name: "Backend API",
    description: "Main backend API service with authentication and core services",
    environments: 3,
    members: 5,
    status: "active" as const,
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Web Dashboard",
    description: "Frontend application for user and admin interfaces",
    environments: 3,
    members: 4,
    status: "active" as const,
    updatedAt: "3 days ago",
  },
  {
    id: "3",
    name: "Mobile App",
    description: "React Native mobile application for iOS and Android",
    environments: 2,
    members: 3,
    status: "inactive" as const,
    updatedAt: "1 week ago",
  }
]

export function ProjectCards() {
  const [projects, setProjects] = useState(mockProjects)
  
  // Fetch projects from API (simulate with timeout)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Here you would fetch from API
        // const response = await fetch('/api/projects')
        // const data = await response.json()
        // setProjects(data)
        
        // Just using mock data for now
        setProjects(mockProjects)
      } catch (error) {
        console.error("Error fetching projects:", error)
      }
    }
    
    fetchProjects()
  }, [])
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-1">
                  {project.description}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mt-1 -mr-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Edit project</DropdownMenuItem>
                  <DropdownMenuItem>Clone project</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span>{project.environments} environments</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{project.members} members</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-3">
            <div className="text-xs text-muted-foreground">
              Updated {project.updatedAt}
            </div>
            <Badge
              variant={
                project.status === "active" ? "default" : "secondary"
              }
            >
              {project.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </CardFooter>
        </Card>
      ))}
      <Link href="/dashboard/projects/new" className="block">
        <Card className="flex h-full flex-col items-center justify-center border-dashed p-6 transition-colors hover:bg-muted/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 font-medium">Create New Project</h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Set up a new project to manage your secrets
          </p>
        </Card>
      </Link>
    </div>
  )
} 