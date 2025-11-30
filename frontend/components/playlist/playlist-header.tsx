"use client"

import { Button } from "@/components/ui/button"
import { Play, Shuffle } from "lucide-react"
import type { Playlist } from "@/lib/types"

interface PlaylistHeaderProps {
  playlist: Playlist
  onPlayAll?: () => void
  onShuffle?: () => void
}

export function PlaylistHeader({ playlist, onPlayAll, onShuffle }: PlaylistHeaderProps) {
  const totalDuration = playlist.dramas.reduce((acc, drama) => acc + drama.duration, 0)
  const totalViews = playlist.dramas.reduce((acc, drama) => acc + drama.viewCount, 0)

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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
    <div className="relative">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={playlist.thumbnail || "/placeholder.svg"}
          alt={playlist.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative p-8 text-white">
        <div className="max-w-2xl">
          <div className="mb-4">
            <span className="px-3 py-1 text-sm bg-primary/80 rounded-full capitalize">
              {playlist.category.replace("-", " ")}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{playlist.title}</h1>
          <p className="text-lg text-white/90 mb-6 leading-relaxed">{playlist.description}</p>

          <div className="flex items-center space-x-6 text-sm text-white/80 mb-6">
            <span>{playlist.dramas.length} episodes</span>
            <span>{formatTotalDuration(totalDuration)} total</span>
            <span>{formatViews(totalViews)} total views</span>
          </div>

          <div className="flex space-x-4">
            <Button size="lg" onClick={onPlayAll} className="bg-primary hover:bg-primary/90">
              <Play className="h-5 w-5 mr-2" />
              Play All
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onShuffle}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <Shuffle className="h-5 w-5 mr-2" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
