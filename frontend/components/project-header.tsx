"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GitBranch, Users, Calendar } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  environments: number
  members: number
  updatedAt: string
  status: "active" | "inactive"
}

export function ProjectHeader({ id }: { id: string }) {
  // Sample project data - matches the mock data in projects-list
  const project = {
    id,
    name: "Backend API",
    description: "Main backend API service with authentication and core services",
    environments: 3,
    members: 5,
    updatedAt: "2 hours ago",
    status: "active",
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
          <Badge>{project.status}</Badge>
        </div>
        <p className="text-muted-foreground">{project.description}</p>
        <div className="flex flex-wrap gap-4 pt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            <span>{project.environments} environment{project.environments !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.members} team member{project.members !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Updated {project.updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
