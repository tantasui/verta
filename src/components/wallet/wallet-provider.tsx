"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createNetworkConfig, SuiClientProvider, WalletProvider as SuiWalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client"
import { useUserStore } from "../../lib/store"

// Configure Sui network
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  devnet: { url: getFullnodeUrl("devnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
})

const queryClient = new QueryClient()

interface WalletContextType {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setConnected } = useUserStore()
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const connect = async () => {
    try {
      // Mock wallet connection for demo
      const mockAddress = "0x1234567890abcdef1234567890abcdef12345678"
      setAddress(mockAddress)
      setIsConnected(true)
      setConnected(true)
      setUser({
        id: "user-1",
        address: mockAddress,
        username: "Demo User",
        joinedAt: new Date(),
        totalUploads: 0,
        totalViews: 0,
        favoriteGenres: [],
      })
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setConnected(false)
    setUser(null)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <SuiWalletProvider autoConnect>
          <WalletContext.Provider value={{ isConnected, address, connect, disconnect }}>
            {children}
          </WalletContext.Provider>
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
