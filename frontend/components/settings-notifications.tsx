"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, MessageSquare, Shield, Save } from "lucide-react"

export function SettingsNotifications() {
  const [emailNotifications, setEmailNotifications] = useState({
    securityAlerts: true,
    accountActivity: true,
    newFeatures: false,
    marketing: false,
  })

  const [pushNotifications, setPushNotifications] = useState({
    securityAlerts: true,
    accountActivity: true,
    secretChanges: true,
    teamActivity: false,
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSave = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage the emails you receive from SolSecure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Security Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive emails for suspicious login attempts and security updates
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.securityAlerts}
              onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, securityAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Account Activity</p>
                <p className="text-sm text-muted-foreground">Receive emails for account changes and billing updates</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.accountActivity}
              onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, accountActivity: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">New Features</p>
                <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.newFeatures}
              onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, newFeatures: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Marketing</p>
                <p className="text-sm text-muted-foreground">Receive emails about promotions and newsletters</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.marketing}
              onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, marketing: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Manage the push notifications you receive from SolSecure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Security Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for suspicious login attempts and security updates
                </p>
              </div>
            </div>
            <Switch
              checked={pushNotifications.securityAlerts}
              onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, securityAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Account Activity</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for account changes and billing updates
                </p>
              </div>
            </div>
            <Switch
              checked={pushNotifications.accountActivity}
              onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, accountActivity: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Secret Changes</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when secrets are added, updated, or deleted
                </p>
              </div>
            </div>
            <Switch
              checked={pushNotifications.secretChanges}
              onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, secretChanges: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Team Activity</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about team member actions and changes
                </p>
              </div>
            </div>
            <Switch
              checked={pushNotifications.teamActivity}
              onCheckedChange={(checked) => setPushNotifications({ ...pushNotifications, teamActivity: checked })}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
