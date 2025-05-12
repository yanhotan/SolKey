"use client";

import { useState } from "react";
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

export function TeamManagement() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  // Sample team members data
  const teamMembers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "owner",
      avatar: "/images/no1_avatar.jpg",
      initials: "JD",
      status: "active",
      joinedAt: "May 2023",
    },
    {
      id: "2",
      name: "Sarah Kim",
      email: "sarah@example.com",
      role: "admin",
      avatar: "/images/no2_avatar.jpg",
      initials: "SK",
      status: "active",
      joinedAt: "June 2023",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "member",
      avatar: "/images/no3_avatar.jpg",
      initials: "MJ",
      status: "active",
      joinedAt: "July 2023",
    },
    {
      id: "4",
      name: "Lisa Chen",
      email: "lisa@example.com",
      role: "member",
      avatar: "/images/no4_avatar.jpg",
      initials: "LC",
      status: "active",
      joinedAt: "August 2023",
    },
    {
      id: "5",
      name: "David Wilson",
      email: "david@example.com",
      role: "member",
      avatar: "/images/no5_avatar.jpg",
      initials: "DW",
      status: "pending",
      joinedAt: "September 2023",
    },
  ];

  const handleChangeRole = (memberId: string) => {
    setSelectedMember(memberId);
    setIsRoleDialogOpen(true);
    // Find current role and set it as default
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
    // Logic to change role would go here
    console.log(`Changed role for member ${selectedMember} to ${newRole}`);
    setIsRoleDialogOpen(false);
  };

  const confirmRemoveMember = () => {
    // Logic to remove member would go here
    console.log(`Removed member ${selectedMember}`);
    setIsRemoveDialogOpen(false);
  };

  const resendInvitation = (memberId: string) => {
    // Logic to resend invitation would go here
    console.log(`Resent invitation to member ${memberId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage your team members and their roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                    onClick={() => resendInvitation(member.id)}
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
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Change role
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {member.role !== "owner" && (
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Remove member
                        </DropdownMenuItem>
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
                Are you sure you want to remove this member from your team? They
                will lose access to all projects.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRemoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRemoveMember}>
                Remove Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
