"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Clock } from "lucide-react"
import type { Drama } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NextUpProps {
  nextDrama: Drama | null
  onPlayNext: () => void
  autoPlayCountdown?: number
  className?: string
}

export function NextUp({ nextDrama, onPlayNext, autoPlayCountdown, className }: NextUpProps) {
  if (!nextDrama) return null

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className={cn("border-border bg-card/50 backdrop-blur-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Up Next</h3>
          {autoPlayCountdown && autoPlayCountdown > 0 && (
            <div className="text-sm text-muted-foreground">Auto-play in {autoPlayCountdown}s</div>
          )}
        </div>

        <div className="flex space-x-4">
          <div className="relative flex-shrink-0">
            <img
              src={nextDrama.thumbnail || "/placeholder.svg"}
              alt={nextDrama.title}
              className="w-24 h-16 object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <h4 className="font-medium line-clamp-2">{nextDrama.title}</h4>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(nextDrama.duration)}</span>
              </div>
              <span>{nextDrama.viewCount.toLocaleString()} views</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {nextDrama.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-accent/20 text-accent-foreground rounded-full capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={onPlayNext} className="w-full mt-4" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Play Next
        </Button>
      </CardContent>
    </Card>
  )
}
