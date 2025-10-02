"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { PlaylistHeader } from "../components/playlist/playlist-header"
import { DramaList } from "../components/playlist/drama-list"
import { Button } from "../components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useDramaStore } from "../lib/store"
import { mockPlaylists, mockDramas } from "../lib/mock-data"
import type { Playlist } from "../lib/types"

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { setCurrentDrama } = useDramaStore()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  useEffect(() => {
    if (id) {
      const foundPlaylist = mockPlaylists.find((p) => p.id === id)
      setPlaylist(foundPlaylist || null)
    }
  }, [id])

  const handlePlayDrama = (dramaId: string) => {
    const drama = mockDramas.find((d) => d.id === dramaId)
    if (drama) {
      setCurrentDrama(drama)
    }
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get dramas for this playlist (mock implementation)
  const playlistDramas = mockDramas
    .filter((drama) => drama.tags.some((tag) => playlist.title.toLowerCase().includes(tag.toLowerCase())))
    .slice(0, playlist.dramaCount)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link to="/playlists">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playlists
        </Button>
      </Link>

      {/* Playlist Header */}
      <PlaylistHeader
        playlist={playlist}
        onPlayAll={() => handlePlayDrama(playlistDramas[0]?.id)}
        onShuffle={() => {
          const randomDrama = playlistDramas[Math.floor(Math.random() * playlistDramas.length)]
          handlePlayDrama(randomDrama?.id)
        }}
      />

      {/* Drama List */}
      <DramaList
        dramas={playlistDramas}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPlayDrama={handlePlayDrama}
      />
    </div>
  )
}
