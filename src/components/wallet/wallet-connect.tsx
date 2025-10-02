"use client"

import { Button } from "../ui/button"
import { Wallet, LogOut } from "lucide-react"
import { useWallet } from "./wallet-provider"
import { cn } from "../../lib/utils"

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { isConnected, address, connect, disconnect } = useWallet()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <span className="text-sm text-muted-foreground hidden sm:inline">{formatAddress(address)}</span>
        <Button variant="outline" size="sm" onClick={disconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Disconnect</span>
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connect} className={className}>
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  )
}
