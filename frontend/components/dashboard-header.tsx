/// <reference types="react" />

"use client"

import * as React from "react"
import { Bell, Search, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConnectWalletButton } from "@/components/connect-wallet-wallet-button"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletUser } from "@/hooks/use-wallet-user"
import { Badge } from "@/components/ui/badge"
import { shortenAddress } from "@/lib/utils"
import { HTMLAttributes } from "react"
import Image from "next/image"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const { connected, disconnect, publicKey } = useWallet()
  const { user, isLoading: userLoading, error: userError } = useWalletUser()

  // User data is now available but we're not changing the UI yet
  // This provides access to:
  // - user?.id: User database ID
  // - user?.username: Auto-generated username (user_<wallet_chars>)
  // - user?.email: Auto-generated email (<wallet_chars>@gmail.com)
  // - user?.wallet_address: Wallet address
  // - user?.created_at: Account creation timestamp

  const handleDisconnect = async () => {
    try {
      if (disconnect) {
        const clearStorageData = () => {
          const STORAGE_KEY_PREFIX = 'solkey';
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX) && !key.startsWith('encrypted:')) {
              localStorage.removeItem(key);
            }
          });
        };
        clearStorageData();
        await disconnect();
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="h-6 w-6">
          <Image 
            src="/images/solsecure_logo.png" 
            alt="SolSecure Logo" 
            width={24} 
            height={24} 
            className="h-6 w-6"
          />
        </div>
        <span className="font-bold bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[size:200%_auto]">SolSecure</span>
      </Link>
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[300px] lg:w-[400px]"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {connected && publicKey ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            onClick={handleDisconnect}
          >
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            {shortenAddress(publicKey.toBase58())}
            <Badge variant="outline" className="ml-1 text-xs">
              Devnet
            </Badge>
          </Button>
        ) : (
          <ConnectWalletButton />
        )}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-500"></span>
          <span className="sr-only">Notifications</span>
        </Button>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/images/no1_avatar.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            {connected && (
              <DropdownMenuItem onClick={handleDisconnect}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Disconnect Wallet</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
