"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { Play, Clock, Eye, MoreVertical, Grid, List } from "lucide-react"
import type { Drama } from "../../lib/types"
import { cn } from "../../lib/utils"

interface DramaListProps {
  dramas: Drama[]
  viewMode?: "list" | "grid"
  onViewModeChange?: (mode: "list" | "grid") => void
  onPlayDrama?: (dramaId: string) => void
  className?: string
}

export function DramaList({ dramas, viewMode = "list", onViewModeChange, onPlayDrama, className }: DramaListProps) {
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
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      {onViewModeChange && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Episodes ({dramas.length})</h3>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Drama List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
        {dramas.map((drama, index) => (
          <div
            key={drama.id}
            className={cn(
              "group transition-colors cursor-pointer",
              viewMode === "list"
                ? "flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50"
                : "p-4 rounded-lg hover:bg-muted/50",
            )}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {viewMode === "list" ? (
              <>
                {/* Index/Play Button */}
                <div className="flex-shrink-0 w-8 text-center">
                  {hoveredIndex === index ? (
                    <Link to={`/watch?id=${drama.id}`}>
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
              </>
            ) : (
              // Grid view
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <img
                    src={drama.thumbnail || "/placeholder.svg"}
                    alt={drama.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link to={`/watch?id=${drama.id}`}>
                      <Button size="sm" className="bg-primary/90 hover:bg-primary">
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                    </Link>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{drama.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                    <span>{formatViews(drama.viewCount)} views</span>
                    <span>{formatDuration(drama.duration)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
