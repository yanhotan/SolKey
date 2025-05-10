"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Sample activity data
  const activities = [
    {
      date: "May 7th, 2025",
      events: [
        {
          id: "1",
          user: "Yan Ho",
          action: "Modified secrets and saved to vault",
          project: "Backend API",
          time: "11:50 AM GMT+8",
          browser: "Chrome",
          os: "Windows 10",
          sessionId: "HoJcuDdN45L4eIrQ8V0pt5yq",
          type: "secret",
          changes: [
            {
              key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
              type: "String",
              action: "modified",
            },
            {
              key: "NEXT_PUBLIC_SUPABASE_URL",
              type: "String",
              action: "added",
            },
          ],
        },
        {
          id: "2",
          user: "Yan Ho",
          action: "Modified secrets and saved to vault",
          project: "Backend API",
          time: "11:49 AM GMT+8",
          browser: "Chrome",
          os: "Windows 10",
          sessionId: "OvyOaMMj2Iw4rmYYm2MAOrHL",
          type: "secret",
          changes: [
            {
              key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
              type: "String",
              action: "added",
            },
          ],
        },
      ],
    },
    {
      date: "May 6th, 2025",
      events: [
        {
          id: "3",
          user: "John Doe",
          action: "Created project",
          project: "Backend API",
          time: "3:22 PM GMT+8",
          browser: "Firefox",
          os: "macOS",
          sessionId: "KpL3mNzXq9rTyU7vW8sA2bCd",
          type: "project",
          changes: [],
        },
        {
          id: "4",
          user: "Sarah Kim",
          action: "Added config sync",
          project: "Web Dashboard",
          time: "1:15 PM GMT+8",
          browser: "Chrome",
          os: "Linux",
          sessionId: "Rt7zXyVw9qP3mN4bQ8sD1fG",
          type: "config",
          changes: [],
        },
        {
          id: "5",
          user: "Mike Johnson",
          action: "Updated access permissions",
          project: "Mobile App",
          time: "10:30 AM GMT+8",
          browser: "Safari",
          os: "iOS",
          sessionId: "Jk2lMn3bVc4xZ5pQ6rS7tU",
          type: "access",
          changes: [],
        },
      ],
    },
  ]

  // Filter activities based on search query and filters
  const filteredActivities = activities
    .map((day) => {
      const filteredEvents = day.events.filter((event) => {
        const matchesSearch =
          event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.project.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesProject = projectFilter === "all" || event.project === projectFilter
        const matchesType = typeFilter === "all" || event.type === typeFilter

        return matchesSearch && matchesProject && matchesType
      })

      return {
        ...day,
        events: filteredEvents,
      }
    })
    .filter((day) => day.events.length > 0)

  // Get unique projects for filter
  const projects = [...new Set(activities.flatMap((day) => day.events.map((event) => event.project)))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search activity logs..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="secret">Secrets</SelectItem>
              <SelectItem value="config">Config Syncs</SelectItem>
              <SelectItem value="access">Access</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
            <span className="sr-only">Date filter</span>
          </Button>
        </div>
      </div>

      {filteredActivities.length > 0 ? (
        <div className="space-y-8">
          {filteredActivities.map((day) => (
            <div key={day.date} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <h4 className="font-medium">{day.date}</h4>
              </div>
              <div className="space-y-6 pl-4">
                {day.events.map((event) => (
                  <div key={event.id} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">{event.user.charAt(0)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{event.user}</div>
                        <div className="text-sm text-muted-foreground">{event.action}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{event.project}</Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              event.type === "secret"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                : event.type === "config"
                                  ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                  : event.type === "access"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                    : "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
                            )}
                          >
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {event.changes.length > 0 && (
                      <div className="mt-4 rounded-md border bg-muted/30 p-3">
                        {event.changes.map((change, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  change.action === "added" ? "text-green-500" : "text-amber-500",
                                )}
                              >
                                {change.action === "added" ? "+" : "~"}
                              </span>
                              <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">{change.key}</code>
                            </div>
                            <Badge variant="outline">{change.type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{event.time}</span>
                      <span>•</span>
                      <span>{event.browser}</span>
                      <span>•</span>
                      <span>{event.os}</span>
                      <span>•</span>
                      <span className="font-mono">{event.sessionId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">No activity found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || projectFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "No activity has been recorded yet"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
