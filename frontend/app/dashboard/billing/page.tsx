import type { Metadata } from "next"
import { BillingPlans } from "@/components/billing-plans"
import { PaymentHistory } from "@/components/payment-history"
import { ConnectWallet } from "@/components/connect-wallet"

export const metadata: Metadata = {
  title: "Billing - SolSecrets",
  description: "Manage your subscription and payment methods",
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods</p>
      </div>
      <ConnectWallet />
      <BillingPlans />
      <PaymentHistory />
    </div>
  )
}
