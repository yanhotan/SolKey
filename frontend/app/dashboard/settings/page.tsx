import type { Metadata } from "next"
import { SettingsGeneral } from "@/components/settings-general"
import { SettingsSecurity } from "@/components/settings-security"
import { SettingsNotifications } from "@/components/settings-notifications"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Settings - SolSecure",
  description: "Manage your account settings and preferences",
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <SettingsGeneral />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SettingsSecurity />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <SettingsNotifications />
        </TabsContent>
      </Tabs>
    </div>
  )
}
