"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GitBranch, Users, Calendar } from "lucide-react"


export function ProjectHeader({ project }: { project: any }) {

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
            <span>{project.environments?.length ?? 0} environment{project.environments !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.project_members?.length ?? 0} team member{project.members !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Updated {project.updated_at}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
