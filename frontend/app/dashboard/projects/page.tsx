import type { Metadata } from "next"
import { ProjectsList } from "@/components/projects-list"
import { ProjectsHeader } from "@/components/projects-header"

export const metadata: Metadata = {
  title: "Projects - SolSecure",
  description: "Manage your projects and their environment variables",
}

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <ProjectsHeader />
      <ProjectsList />
    </div>
  )
}
