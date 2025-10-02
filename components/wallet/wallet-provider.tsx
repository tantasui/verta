"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useUserStore } from "@/lib/store"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | null>(null)

interface WalletProviderProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { user, isConnected, setUser, setConnected } = useUserStore()

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if wallet was previously connected (localStorage, etc.)
        const savedUser = localStorage.getItem("reelshort_user")
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          setConnected(true)
        }
      } catch (error) {
        console.error("Failed to restore wallet connection:", error)
      }
    }

    checkWalletConnection()
  }, [setUser, setConnected])

  // Save user to localStorage when connected
  useEffect(() => {
    if (user && isConnected) {
      localStorage.setItem("reelshort_user", JSON.stringify(user))
    } else {
      localStorage.removeItem("reelshort_user")
    }
  }, [user, isConnected])

  const connect = async () => {
    try {
      // This would integrate with actual Sui wallet
      // For now, we'll use the mock implementation from WalletConnect
      console.log("Connecting to Sui wallet...")
    } catch (error) {
      console.error("Wallet connection failed:", error)
      throw error
    }
  }

  const disconnect = () => {
    setUser(null)
    setConnected(false)
    localStorage.removeItem("reelshort_user")
  }

  const contextValue: WalletContextType = {
    isConnected,
    address: user?.address || null,
    connect,
    disconnect,
  }

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
