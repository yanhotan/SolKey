"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  FolderKanban,
  Users,
  Activity,
  CreditCard,
  Settings,
  HelpCircle,
  LifeBuoy,
  GitPullRequest,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function DashboardSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Projects",
      icon: <FolderKanban className="h-5 w-5" />,
      href: "/dashboard/projects",
      active: pathname === "/dashboard/projects" || pathname.startsWith("/dashboard/projects/"),
    },
    {
      label: "Team",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/team",
      active: pathname === "/dashboard/team",
    },
    {
      label: "Activity",
      icon: <Activity className="h-5 w-5" />,
      href: "/dashboard/activity",
      active: pathname === "/dashboard/activity",
    },
    {
      label: "Change Requests",
      icon: <GitPullRequest className="h-5 w-5" />,
      href: "/dashboard/change-requests",
      active: pathname === "/dashboard/change-requests",
    },
    {
      label: "Billing",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/dashboard/billing",
      active: pathname === "/dashboard/billing",
    },
    {
      label: "AI Assistant",
      icon: <Bot className="h-5 w-5" />,
      href: "/dashboard/assistant",
      active: pathname === "/dashboard/assistant",
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ]

  return (
    <div className="sticky top-0 h-screen flex w-64 flex-col border-r bg-sidebar-background text-sidebar-foreground">
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route, index) => (
            <motion.div
              key={route.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={route.active ? "secondary" : "ghost"}
                className={cn(
                  "justify-start",
                  route.active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
                asChild
              >
                <Link href={route.href}>
                  {route.icon}
                  <span className="ml-2">{route.label}</span>
                </Link>
              </Button>
            </motion.div>
          ))}
        </nav>
        <div className="mt-6 px-4">
          <motion.div
            className="rounded-lg border border-sidebar-border bg-card p-4"
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Need help?</h4>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Check our documentation or contact support for assistance.
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="#">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Support
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
