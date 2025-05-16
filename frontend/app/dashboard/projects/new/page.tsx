import type { Metadata } from "next"
import { NewProjectForm } from "@/components/new-project-form"

export const metadata: Metadata = {
  title: "Create New Project - SolSecure",
  description: "Create a new project to manage your secrets",
}

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">Set up a new project to manage your secrets</p>
      </div>
      <NewProjectForm />
    </div>
  )
}
