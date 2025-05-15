"use client";

import type { Metadata } from "next"
import { DashboardOverview } from "@/components/dashboard-overview"
import { RecentActivity } from "@/components/recent-activity"
import { QuickActions } from "@/components/quick-actions"


import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard-overview";
import { RecentActivity } from "@/components/recent-activity";
import { QuickActions } from "@/components/quick-actions";
import { ProjectCards } from "@/components/project-cards";
import { ProjectsHeader } from "@/components/projects-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { EncryptionTest } from "@/components/encryption-test";

export default function DashboardPage() {
  const metadata: Metadata = {
    title: "Dashboard - SolSecrets",
    description: "Manage your secrets and environment variables",
  };

  return (
<<<<<<< Updated upstream
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
=======
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          
        </div>
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="test">Encryption Test</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="space-y-4">
            <ProjectsHeader />
            <ProjectCards />
          </TabsContent>
          <TabsContent value="test" className="space-y-4">
            <div className="grid gap-4">
              <EncryptionTest />
            </div>
          </TabsContent>
        </Tabs>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
