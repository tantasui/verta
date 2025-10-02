"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Clock, Eye, MoreVertical } from "lucide-react"
import type { Drama } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DramaListProps {
  dramas: Drama[]
  onPlayDrama?: (drama: Drama) => void
  className?: string
}

export function DramaList({ dramas, onPlayDrama, className }: DramaListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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
    <div className={cn("space-y-2", className)}>
      {dramas.map((drama, index) => (
        <div
          key={drama.id}
          className="group flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Index/Play Button */}
          <div className="flex-shrink-0 w-8 text-center">
            {hoveredIndex === index ? (
              <Link href={`/watch?id=${drama.id}`}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Play className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">{index + 1}</span>
            )}
          </div>

          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <img
              src={drama.thumbnail || "/placeholder.svg"}
              alt={drama.title}
              className="w-16 h-12 object-cover rounded"
            />
          </div>

          {/* Drama Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">{drama.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{drama.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-1">
              {drama.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-accent/20 text-accent-foreground rounded-full capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 text-right space-y-1">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{formatViews(drama.viewCount)}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(drama.duration)}</span>
            </div>
          </div>

          {/* More Options */}
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
