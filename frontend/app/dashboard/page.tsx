import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard-overview";
import { RecentActivity } from "@/components/recent-activity";
import { QuickActions } from "@/components/quick-actions";
import { ProjectCards } from "@/components/project-cards";
import { ProjectsHeader } from "@/components/projects-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EncryptionTest } from "@/components/encryption-test";
import { WalletButton } from "@/components/wallet-button";

export default function DashboardPage() {
//   const metadata: Metadata = {
//     title: "Dashboard - SolSecrets",
//     description: "Manage your secrets and environment variables",
//   };

   const metadata: Metadata = {
    title: "Dashboard - SolSecrets",
    description: "Manage your secrets and environment variables",
   };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage your secrets and environment variables</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardOverview />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}
