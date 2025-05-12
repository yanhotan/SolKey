"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Minus,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ChangeRequestDetail({ id }: { id: string }) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [environmentToAction, setEnvironmentToAction] = useState<string | null>(
    null
  );
  const [expandedEnvironments, setExpandedEnvironments] = useState<
    Record<string, boolean>
  >({
    dev: true,
    stg: true,
    prd: true,
  });

  // Mock data for the change request
  const changeRequest = {
    id,
    title: "Update db credentials",
    status: "in-review",
    environments: [
      {
        name: "dev",
        status: "applied",
        changes: [
          {
            key: "DB_PASSWORD",
            type: "String",
            oldValue: "••••••••••••",
            newValue: "••••••••••••",
          },
          {
            key: "DB_UID",
            type: "String",
            oldValue: "••••••••••••",
            newValue: "••••••••••••",
          },
        ],
      },
      {
        name: "stg",
        status: "in-review",
        changes: [
          {
            key: "DB_PASSWORD",
            type: "String",
            oldValue: "••••••••••••",
            newValue: "••••••••••••",
          },
          {
            key: "DB_UID",
            type: "String",
            oldValue: "••••••••••••",
            newValue: "••••••••••••",
          },
        ],
      },
      {
        name: "prd",
        status: "in-review",
        changes: [
          {
            key: "DB_PASSWORD",
            type: "String",
            oldValue: "••••••••••••",
            newValue: "••••••••••••",
          },
          {
            key: "DB_UID",
            type: "String",
            oldValue: "••••••••••••",
            newValue: "••••••••••••",
          },
        ],
      },
    ],
  };

  const toggleEnvironment = (env: string) => {
    setExpandedEnvironments((prev) => ({
      ...prev,
      [env]: !prev[env],
    }));
  };

  const handleApprove = (env: string) => {
    setEnvironmentToAction(env);
    setIsApproveDialogOpen(true);
  };

  const handleApplyToConfig = (env: string) => {
    setEnvironmentToAction(env);
    setIsApplyDialogOpen(true);
  };

  const confirmApprove = () => {
    // Logic to approve changes would go here
    console.log(`Approved changes for ${environmentToAction}`);
    setIsApproveDialogOpen(false);
  };

  const confirmApply = () => {
    // Logic to apply changes would go here
    console.log(`Applied changes to ${environmentToAction}`);
    setIsApplyDialogOpen(false);
  };

  // Function to get environment badge styling
  const getEnvironmentBadgeClass = (env: string) => {
    switch (env) {
      case "dev":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "stg":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "prd":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800";
      default:
        return "";
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-review":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card">
        {changeRequest.environments.map((env) => (
          <div key={env.name} className="border-b last:border-b-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleEnvironment(env.name)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedEnvironments[env.name] ? "rotate-180" : ""
                    }`}
                  />
                  <span className="sr-only">Toggle {env.name}</span>
                </Button>
                <Badge
                  variant="outline"
                  className={`capitalize ${getEnvironmentBadgeClass(env.name)}`}
                >
                  {env.name}
                </Badge>
                {getStatusIcon(env.status)}
              </div>
              <div className="flex items-center gap-2">
                {env.status === "in-review" && (
                  <>
                    <Button
                      variant={env.name === "prd" ? "outline" : "default"}
                      size="sm"
                      className={
                        env.name === "prd"
                          ? "text-muted-foreground"
                          : "bg-green-500 hover:bg-green-600"
                      }
                      onClick={() => handleApprove(env.name)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        env.name === "prd"
                          ? "bg-purple-500 text-white hover:bg-purple-600 hover:text-white"
                          : "text-muted-foreground"
                      }
                      onClick={() => handleApplyToConfig(env.name)}
                    >
                      Apply to Config
                    </Button>
                  </>
                )}
                {env.status === "applied" && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  >
                    Applied
                  </Badge>
                )}
              </div>
            </div>
            {expandedEnvironments[env.name] && (
              <div className="border-t bg-muted/30 p-4">
                <div className="space-y-2">
                  {env.changes.map((change, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr,180px,1fr] gap-2 rounded-md border bg-card"
                    >
                      <div className="flex items-center gap-2 border-r p-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                          <Minus className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-mono text-sm">
                                {change.oldValue}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Previous value (encrypted)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge variant="outline" className="ml-auto">
                          {change.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-center border-r bg-muted/50 px-2 font-mono text-sm">
                        {change.key}
                      </div>
                      <div className="flex items-center gap-2 p-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                          <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-mono text-sm">
                                {change.newValue}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>New value (encrypted)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge variant="outline" className="ml-auto">
                          {change.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Approve Dialog */}
      <AlertDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve these changes for the{" "}
              {environmentToAction} environment? This action will mark the
              changes as approved but will not apply them to the configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Approve Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply Dialog */}
      <AlertDialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply to Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply these changes to the{" "}
              {environmentToAction} environment? This action will update the
              actual configuration values and cannot be easily reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApply}
              className={
                environmentToAction === "prd"
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }
            >
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
