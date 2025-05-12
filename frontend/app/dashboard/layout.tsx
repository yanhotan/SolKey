import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { WalletAuthGate } from "@/components/wallet-auth-gate"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletAuthGate>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="sticky top-0 h-screen">
            <DashboardSidebar />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
   </WalletAuthGate>
  )
}

