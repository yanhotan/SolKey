"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check } from "lucide-react"
import { usePermissionProgram } from "@/hooks/usePermissionProgram"
import { isValidPublicKey } from "@/lib/solana"
import { useWallet } from "@solana/wallet-adapter-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

export function TeamInvite() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [message, setMessage] = useState("I'd like to invite you to collaborate on SolSecure.")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const { publicKey } = useWallet()
  const { addMember, initialized, loading: programLoading } = usePermissionProgram()

  // Fetch all projects owned by the user
  useEffect(() => {
    async function fetchUserProjects() {
      if (!publicKey) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        // Get all projects where the user is the owner
        const response = await fetch(`${apiUrl}/api/projects?walletAddress=${publicKey.toBase58()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    }

    fetchUserProjects();
  }, [publicKey]);

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleInvite = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (!isValidPublicKey(email)) {
        throw new Error("Invalid Solana wallet address")
      }

      if (selectedProjects.length === 0) {
        throw new Error("Please select at least one project")
      }

      // Add member using permission program
      const tx = await addMember(email)
      if (tx) {
        // Add member to each selected project in the database
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        
        // Add member to each selected project
        await Promise.all(selectedProjects.map(async (projectId) => {
          const response = await fetch(`${apiUrl}/api/projects/${projectId}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: email,
              role: role
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add member to project');
          }
        }));

        setSuccess(true)
        // Reset form
        setEmail("")
        setMessage("I'd like to invite you to collaborate on SolSecure.")
        setSelectedProjects([])

        // Dispatch custom event for TeamManagement component
        const event = new CustomEvent('memberAdded', { 
          detail: { 
            walletAddress: email,
            projectIds: selectedProjects,
            role: role
          }
        });
        window.dispatchEvent(event);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      } else {
        throw new Error("Failed to add member to the project")
      }
    } catch (err: any) {
      setError(err.message || "Failed to add member")
      setSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>Add new members to your workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Member Added Successfully</AlertTitle>
            <AlertDescription>The team member has been added to the selected projects.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Wallet Address</Label>
          <Input
            id="email"
            type="text"
            placeholder="Enter Solana wallet address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Project Access</Label>
          <div className="rounded-md border p-4">
            <div className="mb-4">
              <p className="text-sm font-medium">Select which projects this member can access:</p>
            </div>
            <div className="space-y-2">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <Label htmlFor={`project-${project.id}`} className="text-sm font-normal">
                      {project.name}
                      {project.description && (
                        <span className="ml-2 text-muted-foreground">({project.description})</span>
                      )}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No projects available. Create a project first to add members.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Personal Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Add a personal message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleInvite} 
          disabled={isLoading || !email || !initialized || programLoading || selectedProjects.length === 0}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isLoading ? "Adding Member..." : "Add Member"}
        </Button>
      </CardFooter>
    </Card>
  )
}
