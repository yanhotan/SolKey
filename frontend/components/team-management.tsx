"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Shield, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissionProgram } from "@/hooks/usePermissionProgram";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  role: "owner" | "admin" | "member";
  avatar: string;
  initials: string;
  status: "active" | "pending";
  joinedAt: string;
}

// Sample names for random assignment
const RANDOM_NAMES = [
  "Alex Thompson",
  "Morgan Lee",
  "Jordan Taylor",
  "Casey Parker",
  "Riley Morgan",
  "Sam Wilson",
  "Jamie Smith",
  "Taylor Brown",
  "Quinn Johnson",
  "Avery Davis",
];

// Predefined team members data (excluding owner)
const PREDEFINED_MEMBERS: TeamMember[] = [
  {
    id: "2",
    name: "Sarah Kim",
    email: "sarah@gmail.com",
    role: "admin",
    avatar: "/images/no2_avatar.jpg",
    initials: "SK",
    status: "active",
    joinedAt: "June 2023",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@gmail.com",
    role: "member",
    avatar: "/images/no3_avatar.jpg",
    initials: "MJ",
    status: "active",
    joinedAt: "July 2023",
  },
  {
    id: "4",
    name: "Lisa Chen",
    email: "lisa@gmail.com",
    role: "member",
    avatar: "/images/no4_avatar.jpg",
    initials: "LC",
    status: "active",
    joinedAt: "August 2023",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david@gmail.com",
    role: "member",
    avatar: "/images/no5_avatar.jpg",
    initials: "DW",
    status: "active",
    joinedAt: "September 2023",
  },
];

export function TeamManagement() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nextPredefinedMemberIndex, setNextPredefinedMemberIndex] = useState(() => {
    const stored = localStorage.getItem('nextPredefinedMemberIndex');
    return stored ? parseInt(stored) : 0;
  });

  const { removeMember, initialized, loading: programLoading } = usePermissionProgram();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const stored = localStorage.getItem('teamMembers');
    return stored ? JSON.parse(stored) : [{
      id: "1",
      name: "John Doe",
      email: "john@gmail.com",
      walletAddress: "", // Project owner's wallet will be here
      role: "owner",
      avatar: "/images/no1_avatar.jpg",
      initials: "JD",
      status: "active",
      joinedAt: "May 2023",
    }];
  });

  // Save to localStorage whenever teamMembers changes
  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  }, [teamMembers]);

  // Save nextPredefinedMemberIndex to localStorage
  useEffect(() => {
    localStorage.setItem('nextPredefinedMemberIndex', nextPredefinedMemberIndex.toString());
  }, [nextPredefinedMemberIndex]);

  const handleChangeRole = (memberId: string) => {
    setSelectedMember(memberId);
    setIsRoleDialogOpen(true);
    const member = teamMembers.find((m) => m.id === memberId);
    if (member) {
      setNewRole(member.role);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMember(memberId);
    setIsRemoveDialogOpen(true);
  };

  const confirmChangeRole = () => {
    setIsRoleDialogOpen(false);
  };

  const confirmRemoveMember = async () => {
    const member = teamMembers.find((m) => m.id === selectedMember);
    if (!member || !member.walletAddress) {
      setError("Member not found or invalid wallet address");
      return;
    }

    try {
      const tx = await removeMember(member.walletAddress);
      if (tx) {
        setTeamMembers(prev => prev.filter(m => m.id !== selectedMember));
        setSuccess(`Successfully removed ${member.name}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error("Failed to remove member");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    } finally {
      setIsRemoveDialogOpen(false);
    }
  };

  // Function to add a new member to the display list
  const addNewMember = (walletAddress: string) => {
    let newMember: TeamMember;

    if (nextPredefinedMemberIndex < PREDEFINED_MEMBERS.length) {
      // Use predefined member data
      const predefinedMember = PREDEFINED_MEMBERS[nextPredefinedMemberIndex];
      newMember = {
        ...predefinedMember,
        id: Date.now().toString(),
        walletAddress,
        role: "member" as const, // Explicitly type as "member"
      };
      setNextPredefinedMemberIndex(prev => prev + 1);
    } else {
      // Fall back to random name if we've used all predefined members
      const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      const initials = randomName.split(' ').map(n => n[0]).join('');
      
      // Use the last predefined member's avatar cyclically
      const avatarIndex = (nextPredefinedMemberIndex % PREDEFINED_MEMBERS.length) + 2;
      
      newMember = {
        id: Date.now().toString(),
        name: randomName,
        email: `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`,
        walletAddress,
        role: "member" as const, // Explicitly type as "member"
        avatar: `/images/no${avatarIndex}_avatar.jpg`,
        initials,
        status: "active" as const, // Explicitly type as "active"
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    }

    setTeamMembers(prev => [...prev, newMember]);
  };

  // Listen for custom event when new member is added
  useEffect(() => {
    const handleNewMember = (event: CustomEvent<{ walletAddress: string }>) => {
      addNewMember(event.detail.walletAddress);
    };

    window.addEventListener('memberAdded' as any, handleNewMember as any);
    return () => {
      window.removeEventListener('memberAdded' as any, handleNewMember as any);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage your team members and their roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-muted-foreground">
            <div className="col-span-4">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-12 gap-4 border-t p-4"
            >
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={member.avatar || "/placeholder.svg"}
                      alt={member.name}
                    />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                    {member.walletAddress && (
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {member.walletAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <Badge
                  variant="outline"
                  className={
                    member.role === "owner"
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                      : member.role === "admin"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                  }
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
              </div>
              <div className="col-span-3 flex items-center">
                {member.status === "active" ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span>Pending</span>
                  </div>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-end">
                {member.status === "pending" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {member.role !== "owner" && (
                        <>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove member
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Change Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Member Role</DialogTitle>
              <DialogDescription>
                Update the role and permissions for this team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 text-sm">
                <h4 className="font-medium">Role permissions:</h4>
                {newRole === "admin" ? (
                  <ul className="list-disc pl-4 text-muted-foreground">
                    <li>Can manage all projects</li>
                    <li>Can invite and remove team members</li>
                    <li>Can manage billing and subscription</li>
                    <li>Can create and delete projects</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-4 text-muted-foreground">
                    <li>Can view and edit assigned projects</li>
                    <li>Cannot manage team members</li>
                    <li>Cannot manage billing and subscription</li>
                    <li>Can create but not delete projects</li>
                  </ul>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={confirmChangeRole}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Dialog */}
        <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Team Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this member from your team? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRemoveDialogOpen(false)}
                disabled={programLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmRemoveMember}
                disabled={programLoading}
              >
                {programLoading ? "Removing..." : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
