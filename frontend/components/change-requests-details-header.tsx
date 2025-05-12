import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GitPullRequest, Clock, User } from "lucide-react"
import Link from "next/link"

export function ChangeRequestHeader({ id }: { id: string }) {
  // Mock data for the change request
  const changeRequest = {
    id,
    title: id === "CR-001" ? "Update db credentials" : `Change Request ${id}`,
    description: "Update database credentials across all environments",
    status: id === "CR-001" ? "in-review" : "pending",
    author: "John Doe",
    createdAt: "2 days ago",
    environments: ["dev", "stg", "prd"],
    changes: 6,
  }

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
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link href="/dashboard/change-requests">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to change requests</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono text-sm text-muted-foreground">{changeRequest.id}</span>
          </div>
          <Badge variant={getStatusBadgeVariant(changeRequest.status)}>
            {getStatusBadgeText(changeRequest.status)}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{changeRequest.title}</h1>
        <p className="text-muted-foreground">{changeRequest.description}</p>
        <div className="flex flex-wrap gap-4 pt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Created by {changeRequest.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{changeRequest.createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
