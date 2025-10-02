"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Play, Clock, Eye } from "lucide-react"
import type { Drama } from "../../lib/types"
import { cn } from "../../lib/utils"

interface DramaCardProps {
  drama: Drama
  onClick?: () => void
  className?: string
  showStats?: boolean
}

export function DramaCard({ drama, onClick, className, showStats = true }: DramaCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border bg-card/50 backdrop-blur-sm",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img
            src={drama.thumbnail || "/placeholder.svg"}
            alt={drama.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Link to={`/watch?id=${drama.id}`}>
              <Button size="lg" className="bg-primary/90 hover:bg-primary text-primary-foreground">
                <Play className="h-6 w-6 mr-2" />
                Watch Now
              </Button>
            </Link>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(drama.duration)}</span>
          </div>

          {/* Emotional Tags */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {drama.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-accent/80 text-accent-foreground rounded-full capitalize backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {drama.title}
          </h3>

          {drama.description && <p className="text-sm text-muted-foreground line-clamp-2">{drama.description}</p>}

          {showStats && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{formatViews(drama.viewCount)} views</span>
              </div>
              <span>{drama.createdAt.toLocaleDateString()}</span>
            </div>
          )}

          {/* All Tags */}
          <div className="flex flex-wrap gap-1 pt-2">
            {drama.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full capitalize">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
