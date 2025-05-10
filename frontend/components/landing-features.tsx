import { Key, Users, GitBranch, History, Shield, Wallet, Terminal, BarChart } from "lucide-react"

export function LandingFeatures() {
  const features = [
    {
      icon: <Key className="h-10 w-10 text-purple-500" />,
      title: "Secrets Management",
      description: "Securely store and manage your environment variables with easy-to-use key-value editor.",
    },
    {
      icon: <GitBranch className="h-10 w-10 text-blue-500" />,
      title: "Environment Management",
      description: "Create, edit, and clone environments for development, staging, and production.",
    },
    {
      icon: <Users className="h-10 w-10 text-purple-500" />,
      title: "Team Collaboration",
      description: "Invite team members and manage permissions for secure collaboration.",
    },
    {
      icon: <History className="h-10 w-10 text-blue-500" />,
      title: "Version History",
      description: "Track changes with detailed version history and diff viewer.",
    },
    {
      icon: <Shield className="h-10 w-10 text-purple-500" />,
      title: "Enterprise Security",
      description: "End-to-end encryption and role-based access control for maximum security.",
    },
    {
      icon: <Wallet className="h-10 w-10 text-blue-500" />,
      title: "Solana Integration",
      description: "Connect your Solana wallet for seamless subscription payments.",
    },
    {
      icon: <Terminal className="h-10 w-10 text-purple-500" />,
      title: "Developer Tools",
      description: "CLI and SDK integrations for popular languages and frameworks.",
    },
    {
      icon: <BarChart className="h-10 w-10 text-blue-500" />,
      title: "Activity Monitoring",
      description: "Comprehensive logs showing who changed what and when.",
    },
  ]

  return (
    <section className="py-20 md:py-32" id="features">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Powerful Features for Modern Development
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Everything you need to manage secrets across your development lifecycle
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
