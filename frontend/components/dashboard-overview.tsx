"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  Users, 
  Key, 
  GitBranch, 
  LoaderCircle,
  Wrench,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { checkWebCryptoCompatibility } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DashboardOverview() {
  const [error, setError] = useState<string | null>(null);
  const [cryptoInfo, setCryptoInfo] = useState<any>(null);
  const [showCryptoInfo, setShowCryptoInfo] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const { connected } = useWallet();

  const stats = [
    {
      title: "Total Projects",
      value: "5",
      description: "2 active this week",
      icon: <FolderKanban className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Environments",
      value: "12",
      description: "Across all projects",
      icon: <GitBranch className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Team Members",
      value: "8",
      description: "3 pending invitations",
      icon: <Users className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "API Keys",
      value: "3",
      description: "Last used 2 hours ago",
      icon: <Key className="h-5 w-5 text-blue-500" />,
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
      
     
      
      {error && (
        <Alert variant="destructive" className="col-span-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="col-span-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground mb-4">
            {connected ? 
              "Visit the Encryption Test page to test the end-to-end encryption flow." : 
              "Connect your wallet to try the encryption features."}
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <a href="/encryption-test">Go to Encryption Test</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
