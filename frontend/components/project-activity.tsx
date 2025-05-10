import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function ProjectActivity({ id }: { id: string }) {
  // Sample activity data
  const activities = [
    {
      id: "1",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      action: "updated the API key",
      environment: "production",
      time: "2 minutes ago",
      secretKey: "API_KEY",
    },
    {
      id: "2",
      user: {
        name: "Sarah Kim",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "SK",
      },
      action: "added a new secret",
      environment: "staging",
      time: "1 hour ago",
      secretKey: "REDIS_CONFIG",
    },
    {
      id: "3",
      user: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      action: "created a new environment",
      environment: "development",
      time: "3 hours ago",
      secretKey: null,
    },
    {
      id: "4",
      user: {
        name: "Lisa Chen",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "LC",
      },
      action: "deleted a secret",
      environment: "staging",
      time: "Yesterday",
      secretKey: "DEBUG_MODE",
    },
    {
      id: "5",
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      action: "invited a team member",
      environment: "all",
      time: "2 days ago",
      secretKey: null,
    },
    {
      id: "6",
      user: {
        name: "Sarah Kim",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "SK",
      },
      action: "updated project settings",
      environment: "all",
      time: "3 days ago",
      secretKey: null,
    },
    {
      id: "7",
      user: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      action: "created the project",
      environment: "all",
      time: "1 week ago",
      secretKey: null,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent actions performed on this project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <p>
                  <span className="font-medium">{activity.user.name}</span> {activity.action}
                  {activity.secretKey && (
                    <>
                      {" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">{activity.secretKey}</code>
                    </>
                  )}{" "}
                  in{" "}
                  <Badge variant="outline" className="capitalize">
                    {activity.environment}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
