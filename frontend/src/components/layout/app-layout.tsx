import type React from "react"
import { Navigation } from "./navigation"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16 pb-20 md:pb-8">{children}</main>
    </div>
  )
}
