"use client"
import { Play, Heart, Share, MoreHorizontal } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import type { Playlist } from "../../lib/types"

interface PlaylistHeaderProps {
  playlist: Playlist
  onPlayAll?: () => void
  onToggleFavorite?: () => void
  isFavorite?: boolean
  className?: string
}

export function PlaylistHeader({
  playlist,
  onPlayAll,
  onToggleFavorite,
  isFavorite = false,
  className,
}: PlaylistHeaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero Section */}
      <div className="relative">
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
          <img
            src={playlist.thumbnail || "/placeholder.svg"}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={onPlayAll}
              size="lg"
              className="w-16 h-16 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
            >
              <Play className="w-8 h-8 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <h1 className="text-3xl font-bold text-balance">{playlist.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{playlist.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFavorite}
              className={cn(
                "transition-colors",
                isFavorite && "text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-950",
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>

            <Button variant="outline" size="sm">
              <Share className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <span>{playlist.dramaCount} episodes</span>
          <span>{playlist.totalDuration}</span>
          <span>Updated {playlist.lastUpdated}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {playlist.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-4 pt-2">
          <Button onClick={onPlayAll} className="flex-shrink-0">
            <Play className="w-4 h-4 mr-2" />
            Play All
          </Button>

          <Button variant="outline">Shuffle Play</Button>

          <Button variant="ghost" size="sm">
            Add to My List
          </Button>
        </div>
      </div>
    </div>
  )
}
