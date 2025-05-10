import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export function ChangeRequestsHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Change Requests</h1>
        <p className="text-muted-foreground">Control changes with audited approvals</p>
      </div>
      <Button asChild>
        <Link href="/dashboard/change-requests/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Change Request
        </Link>
      </Button>
    </div>
  )
}
