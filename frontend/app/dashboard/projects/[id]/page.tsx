'use client'

import { useParams } from 'next/navigation'
import { ProjectDetail } from "@/components/project-detail"
import { ProjectTabs } from "@/components/project-tabs"
import { ProjectHeader } from "@/components/project-header"
import { SecretsEditor } from "@/components/secrets-editor"

export default function ProjectPage() {
  const params = useParams()
  const id = params?.id as string

  if (!id) return null

  return (
    <div className="space-y-6">
      <ProjectHeader id={id} />
      <ProjectTabs id={id} />
      <ProjectDetail id={id} />
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Add New Secret</h2>
        <SecretsEditor 
          projectId={id}
          environment="development"
          searchQuery="" 
        />
      </div>
    </div>
  )
}
