import type { Metadata } from "next"
import { ChangeRequestsList } from "@/components/change-requests-list"
import { ChangeRequestsHeader } from "@/components/change-requests-header"

export const metadata: Metadata = {
  title: "Change Requests - SolSecure",
  description: "Review and approve changes to your secrets",
}

export default function ChangeRequestsPage() {
  return (
    <div className="space-y-6">
      <ChangeRequestsHeader />
      <ChangeRequestsList />
    </div>
  )
}
