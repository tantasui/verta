"use client"

import { useState } from "react"
import { Heart, Zap, Droplets, Smile, Frown, Angry } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { useDramaStore } from "../../lib/store"

interface EmotionalReactionsProps {
  dramaId: string
  onReact?: (emotion: string) => void
  className?: string
}

const reactions = [
  { emotion: "love", icon: Heart, color: "text-red-500", label: "Love" },
  { emotion: "shocked", icon: Zap, color: "text-yellow-500", label: "Shocked" },
  { emotion: "sad", icon: Droplets, color: "text-blue-500", label: "Sad" },
  { emotion: "happy", icon: Smile, color: "text-green-500", label: "Happy" },
  { emotion: "disappointed", icon: Frown, color: "text-gray-500", label: "Disappointed" },
  { emotion: "angry", icon: Angry, color: "text-red-600", label: "Angry" },
]

export function EmotionalReactions({ dramaId, onReact, className }: EmotionalReactionsProps) {
  const { reactions: dramaReactions, addReaction } = useDramaStore()
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null)

  const currentReactions = dramaReactions[dramaId] || []

  const handleReaction = (emotion: string) => {
    // Add reaction to store
    addReaction(dramaId, {
      id: Date.now().toString(),
      emotion,
      timestamp: Date.now(),
      userId: "current-user", // In real app, get from auth
    })

    // Visual feedback
    setSelectedReaction(emotion)
    setAnimatingReaction(emotion)

    // Call callback
    onReact?.(emotion)

    // Reset animation after delay
    setTimeout(() => {
      setAnimatingReaction(null)
      setSelectedReaction(null)
    }, 1000)
  }

  const getReactionCount = (emotion: string) => {
    return currentReactions.filter((r) => r.emotion === emotion).length
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">How are you feeling?</h3>

      <div className="grid grid-cols-3 gap-2">
        {reactions.map(({ emotion, icon: Icon, color, label }) => {
          const count = getReactionCount(emotion)
          const isSelected = selectedReaction === emotion
          const isAnimating = animatingReaction === emotion

          return (
            <Button
              key={emotion}
              variant="outline"
              size="sm"
              onClick={() => handleReaction(emotion)}
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-2 transition-all duration-200",
                isSelected && "ring-2 ring-primary",
                isAnimating && "scale-110 animate-pulse",
              )}
            >
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs">{label}</span>
              {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
            </Button>
          )
        })}
      </div>

      {/* Floating Reaction Animation */}
      {animatingReaction && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          {reactions
            .filter((r) => r.emotion === animatingReaction)
            .map(({ icon: Icon, color }) => (
              <div
                key={animatingReaction}
                className="animate-bounce"
                style={{
                  animation: "float-up 1s ease-out forwards",
                }}
              >
                <Icon className={cn("w-12 h-12", color)} />
              </div>
            ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
