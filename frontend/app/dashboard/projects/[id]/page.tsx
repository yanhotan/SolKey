import { ProjectDetail } from "@/components/project-detail"
import { ProjectTabs } from "@/components/project-tabs"
import { ProjectHeader } from "@/components/project-header"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <ProjectHeader id={params.id} />
      <ProjectTabs id={params.id} />
      <ProjectDetail id={params.id} />
    </div>
  )
}
