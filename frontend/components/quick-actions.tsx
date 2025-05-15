import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderPlus, UserPlus, Key } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Create Project",
      description: "Set up a new project with environments",
      icon: <FolderPlus className="h-4 w-4" />,
      href: "/dashboard/projects/new",
    },
    {
      title: "Invite Team Member",
      description: "Add a colleague to your workspace",
      icon: <UserPlus className="h-4 w-4" />,
      href: "/dashboard/team",
    },
    // {
    //   title: "Generate API Key",
    //   description: "Create a new API key for integrations",
    //   icon: <Key className="h-4 w-4" />,
    //   href: "/dashboard/tokens",
    // },

  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <Button key={index} variant="outline" className="w-full justify-start" asChild>
            <Link href={action.href}>
              <div className="mr-2 h-8 w-8 rounded-full bg-muted flex items-center justify-center">{action.icon}</div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
