"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Clock, CheckCircle, AlertCircle, XCircle, GitPullRequest } from "lucide-react"
import Link from "next/link"

export function ChangeRequestsList() {
  const [searchQuery, setSearchQuery] = useState("")

  // Sample change requests
  const changeRequests = [
    {
      id: "CR-001",
      title: "Update db credentials",
      description: "Update database credentials across all environments",
      status: "in-review",
      author: "John Doe",
      createdAt: "2 days ago",
      environments: ["dev", "stg", "prd"],
      changes: 6,
    },
    {
      id: "CR-002",
      title: "Add payment gateway keys",
      description: "Add Solana payment gateway API keys",
      status: "in-review",
      author: "Sarah Kim",
      createdAt: "1 day ago",
      environments: ["dev", "stg"],
      changes: 4,
    },
    {
      id: "CR-003",
      title: "Update authentication settings",
      description: "Update OAuth client IDs and secrets",
      status: "in-review",
      author: "Mike Johnson",
      createdAt: "5 hours ago",
      environments: ["dev"],
      changes: 2,
    },
    {
      id: "CR-004",
      title: "Add analytics tracking ID",
      description: "Add analytics tracking ID for all environments",
      status: "rejected",
      author: "Lisa Chen",
      createdAt: "3 days ago",
      environments: ["dev", "stg", "prd"],
      changes: 3,
    },
  ]

  // Filter change requests based on search query
  const filteredRequests = changeRequests.filter(
    (request) =>
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.author.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "applied":
        return "success"
      case "in-review":
        return "warning"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Function to get badge text based on status
  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case "applied":
        return "Applied"
      case "in-review":
        return "In Review"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  // Function to get environment badge styling
  const getEnvironmentBadgeClass = (env: string) => {
    switch (env) {
      case "dev":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      case "stg":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      case "prd":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Team Feature</CardTitle>
              <CardDescription>Control changes with audited approvals when you upgrade to Team</CardDescription>
            </div>
            <Button>Upgrade to Team</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            With Change Requests, owners control approving and merging changes proposed by other limited-access team
            members. Practice least privilege access and stay ahead of typos, misconfigurations, expired, or invalid
            secrets through an auditable review and approval flow.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Coordinate changes across multiple configs and projects</h3>
              <p className="text-sm text-muted-foreground">
                Make related changes to multiple environments in a single request
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Review configuration changes before merging</h3>
              <p className="text-sm text-muted-foreground">
                Prevent errors by reviewing changes before they affect your environments
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Track approvals and changes through the activity log</h3>
              <p className="text-sm text-muted-foreground">
                Maintain a complete audit trail of all changes and approvals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="all" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending">In Review</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search change requests..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Link key={request.id} href={`/dashboard/change-requests/${request.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm text-muted-foreground">{request.id}</span>
                      <Badge variant={getStatusBadgeVariant(request.status)} className="ml-2">
                        {getStatusBadgeText(request.status)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-medium">{request.title}</h3>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {request.environments.map((env) => (
                        <Badge key={env} variant="outline" className={`capitalize ${getEnvironmentBadgeClass(env)}`}>
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{request.createdAt}</span>
                    </div>
                    <div className="text-sm">by {request.author}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{request.changes} changes</span>
                      {request.status === "applied" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : request.status === "in-review" ? (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filteredRequests.length === 0 && (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <GitPullRequest className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No change requests found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? `No change requests matching "${searchQuery}"`
                  : "Get started by creating your first change request"}
              </p>
              {!searchQuery && (
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/change-requests/new">Create Change Request</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
