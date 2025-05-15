"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectTeam } from "@/components/project-team"
import { ProjectActivity } from "@/components/project-activity"

export function ProjectTabs({ id }: { id: string }) {
  return (
    <Tabs defaultValue="secrets" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="secrets">Secrets</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="secrets" className="mt-0">
        {/* Secrets content is rendered in ProjectDetail component */}
      </TabsContent>
      <TabsContent value="team" className="mt-6">
        <ProjectTeam id={id} />
      </TabsContent>
      <TabsContent value="activity" className="mt-6">
        <ProjectActivity id={id} />
      </TabsContent>
    </Tabs>
  )
}
