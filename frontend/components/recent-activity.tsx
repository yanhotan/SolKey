import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentActivity() {
  const activities = [
    {
      user: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "JD",
      },
      action: "updated the API key",
      project: "Backend API",
      environment: "production",
      time: "2 minutes ago",
    },
    {
      user: {
        name: "Sarah Kim",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "SK",
      },
      action: "added a new secret",
      project: "Web Dashboard",
      environment: "staging",
      time: "1 hour ago",
    },
    {
      user: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "MJ",
      },
      action: "created a new environment",
      project: "Mobile App",
      environment: "development",
      time: "3 hours ago",
    },
    {
      user: {
        name: "Lisa Chen",
        avatar: "/placeholder.svg?height=32&width=32",
        initials: "LC",
      },
      action: "invited a team member",
      project: "Analytics Service",
      environment: "all",
      time: "Yesterday",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across your projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
              <AvatarFallback>{activity.user.initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span> {activity.action} in{" "}
                <span className="font-medium">{activity.project}</span> ({activity.environment})
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
