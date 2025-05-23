"use client"

import { useState } from "react"
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

export function TeamInvite() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [message, setMessage] = useState("I'd like to invite you to collaborate on SolSecure.")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addMember, initialized, loading: programLoading } = usePermissionProgram()

  const handleInvite = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Validate wallet address
      if (!isValidPublicKey(email)) {
        throw new Error("Invalid Solana wallet address")
      }

      // Add member using permission program
      const tx = await addMember(email)
      if (tx) {
        setSuccess(true)
        // Reset form
        setEmail("")
        setMessage("I'd like to invite you to collaborate on SolSecure.")

        // Dispatch custom event for TeamManagement component
        const event = new CustomEvent('memberAdded', { 
          detail: { walletAddress: email }
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
            <AlertDescription>The team member has been added to the project.</AlertDescription>
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
          disabled={isLoading || !email || !initialized || programLoading}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isLoading ? "Adding Member..." : "Add Member"}
        </Button>
      </CardFooter>
    </Card>
  )
}
