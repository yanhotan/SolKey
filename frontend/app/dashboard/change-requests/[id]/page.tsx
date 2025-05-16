import type { Metadata } from "next"
import { ChangeRequestDetail } from "@/components/change-requests-details"
import { ChangeRequestHeader } from "@/components/change-requests-details-header"

export const metadata: Metadata = {
  title: "Change Request Details - SolSecure",
  description: "Review and approve changes to your secrets",
}

export default function ChangeRequestDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <ChangeRequestHeader id={params.id} />
      <ChangeRequestDetail id={params.id} />
    </div>
  )
}