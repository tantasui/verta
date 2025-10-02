"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { user, isConnected, setUser, setConnected } = useUserStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      // Simulate wallet connection (replace with actual Sui wallet integration)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        address: "0x" + Math.random().toString(16).substr(2, 40),
        username: "User" + Math.floor(Math.random() * 1000),
        isConnected: true,
      }

      setUser(mockUser)
      setConnected(true)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setUser(null)
    setConnected(false)
  }

  const copyAddress = async () => {
    if (user?.address) {
      await navigator.clipboard.writeText(user.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isConnected || !user) {
    return (
      <Button onClick={handleConnect} disabled={isConnecting} className={cn("", className)}>
        <Wallet className="h-4 w-4 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("flex items-center space-x-2", className)}>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {user.username?.slice(0, 2).toUpperCase() || user.address.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{formatAddress(user.address)}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.username || "Anonymous User"}</p>
          <p className="text-xs text-muted-foreground">{formatAddress(user.address)}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
