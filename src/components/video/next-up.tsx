"use client"
import { Play, Clock, Star } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import type { Drama } from "../../lib/types"

interface NextUpProps {
  nextDrama: Drama
  onPlayNext?: () => void
  autoPlayCountdown?: number
  className?: string
}

export function NextUp({ nextDrama, onPlayNext, autoPlayCountdown, className }: NextUpProps) {
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            <img
              src={nextDrama.thumbnail || "/placeholder.svg"}
              alt={nextDrama.title}
              className="w-24 h-32 object-cover rounded-md"
            />
            <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-2">{nextDrama.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{nextDrama.description}</p>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{nextDrama.duration}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>{nextDrama.rating}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {nextDrama.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button onClick={onPlayNext} size="sm" className="flex-1 h-8 text-xs">
                <Play className="w-3 h-3 mr-1" />
                Play Next
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                Add to List
              </Button>
            </div>

            {/* Auto-play Countdown */}
            {autoPlayCountdown !== undefined && autoPlayCountdown > 0 && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">Auto-playing in {autoPlayCountdown}s</p>
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-1000"
                    style={{
                      width: `${((10 - autoPlayCountdown) / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
