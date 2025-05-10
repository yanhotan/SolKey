import type { Metadata } from "next"
import { ActivityLog } from "@/components/activity-log"

export const metadata: Metadata = {
  title: "Activity - SolSecure",
  description: "View activity logs and access information",
}

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">View activity logs and access information</p>
      </div>

      <ActivityLog />
    </div>
  )
}
