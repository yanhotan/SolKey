import type { Metadata } from "next"
import { TeamManagement } from "@/components/team-management"
import { TeamInvite } from "@/components/team-invite"

export const metadata: Metadata = {
  title: "Team - SolSecure",
  description: "Manage your team members and permissions",
}

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Invite team members and manage permissions</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <TeamInvite />
        <TeamManagement />
      </div>
    </div>
  )
}
