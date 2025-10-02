"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Frown, Smile, Zap, Eye, Laugh } from "lucide-react"
import { useDramaStore, useUserStore } from "@/lib/store"
import type { EmotionalTag, Reaction } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EmotionalReactionsProps {
  dramaId: string
  className?: string
}

const emotionConfig: Record<EmotionalTag, { icon: React.ComponentType<any>; label: string; color: string }> = {
  shocked: { icon: Zap, label: "Shocked", color: "text-yellow-400" },
  sad: { icon: Frown, label: "Sad", color: "text-blue-400" },
  happy: { icon: Smile, label: "Happy", color: "text-green-400" },
  angry: { icon: Eye, label: "Angry", color: "text-red-400" },
  romantic: { icon: Heart, label: "Romantic", color: "text-pink-400" },
  suspense: { icon: Eye, label: "Suspense", color: "text-purple-400" },
  comedy: { icon: Laugh, label: "Comedy", color: "text-orange-400" },
  heartbreak: { icon: Heart, label: "Heartbreak", color: "text-red-600" },
}

export function EmotionalReactions({ dramaId, className }: EmotionalReactionsProps) {
  const [recentReaction, setRecentReaction] = useState<EmotionalTag | null>(null)
  const { addReaction, reactions } = useDramaStore()
  const { user, isConnected } = useUserStore()

  const dramaReactions = reactions[dramaId] || []

  const handleReaction = (emotion: EmotionalTag) => {
    if (!user || !isConnected) return

    const reaction: Reaction = {
      id: `${Date.now()}-${Math.random()}`,
      userId: user.id,
      dramaId,
      emotion,
      timestamp: Date.now(),
      createdAt: new Date(),
    }

    addReaction(dramaId, reaction)
    setRecentReaction(emotion)

    // Clear recent reaction after animation
    setTimeout(() => setRecentReaction(null), 600)
  }

  const getReactionCount = (emotion: EmotionalTag) => {
    return dramaReactions.filter((r) => r.emotion === emotion).length
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">How did this make you feel?</h3>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(emotionConfig).map(([emotion, config]) => {
          const Icon = config.icon
          const count = getReactionCount(emotion as EmotionalTag)
          const isRecent = recentReaction === emotion

          return (
            <Button
              key={emotion}
              variant="outline"
              onClick={() => handleReaction(emotion as EmotionalTag)}
              className={cn(
                "flex items-center justify-between p-4 h-auto transition-all duration-200",
                "hover:bg-muted/50 border-border",
                isRecent && "emotion-pulse bg-accent/20 border-accent",
              )}
              disabled={!user || !isConnected}
            >
              <div className="flex items-center space-x-2">
                <Icon className={cn("h-5 w-5", config.color)} />
                <span className="font-medium">{config.label}</span>
              </div>
              {count > 0 && (
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">{count}</span>
              )}
            </Button>
          )
        })}
      </div>

      {(!user || !isConnected) && (
        <p className="text-sm text-muted-foreground text-center">Connect your wallet to react to scenes</p>
      )}
    </div>
  )
}
