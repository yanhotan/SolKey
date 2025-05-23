"use client"
import { ProjectDetail } from "@/components/project-detail"
import { ProjectTabs } from "@/components/project-tabs"
import { ProjectHeader } from "@/components/project-header"
import { useEffect, useState } from "react"
import { ProjectsList } from "@/components/projects-list"
export default function ProjectPage({ params }: { params: { id: string } }) {

  type Projects = {
    id: string
    name: string
    description: string
    status: "active" | "inactive"
    created_at: string
    updated_at: string
    creator_id: string
    environments: {
      id: string
      name: string
      created_at: string
      project_id: string
    }[]
    project_members: {
      id: string
      role: "owner" | "member"
      user_id: string
      created_at: string
      project_id: string
      wallet_address: string | null
    }[]
    secrets: {
      id: string
      iv: string
      name: string
      type: string
      auth_tag: string
      is_locked: boolean
      created_at: string
      updated_at: string
      project_id: string
      environment_id: string
      encrypted_value: string
    }[]
  };

  const [projects, setProjects] = useState<Projects | null>(null);
  
   useEffect(() => {
      async function fetchProjects() {
        const { id } = await params

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${id}`);
          const project = await res.json();
          setProjects(project);
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      }
  
      fetchProjects();
    }, []);

     if (!projects) {
    return <p>Loading project...</p>
  }

  return (
    <div className="space-y-6">
      <ProjectHeader project={projects} />
       <ProjectTabs project={projects} />
      <ProjectDetail id={projects.id} /> 
    </div>
  )
}
