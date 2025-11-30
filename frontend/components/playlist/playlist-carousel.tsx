"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import Link from "next/link"
import type { Playlist } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PlaylistCarouselProps {
  playlists: Playlist[]
  onSelect?: (playlist: Playlist) => void
  className?: string
}

export function PlaylistCarousel({ playlists, onSelect, className }: PlaylistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Width of card + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Curated Playlists</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => scroll("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => scroll("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {playlists.map((playlist) => (
          <Card
            key={playlist.id}
            className="flex-shrink-0 w-80 cursor-pointer group hover:scale-105 transition-transform duration-300 border-border bg-card/50 backdrop-blur-sm"
            onClick={() => onSelect?.(playlist)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden rounded-t-lg">
                <img
                  src={playlist.thumbnail || "/placeholder.svg"}
                  alt={playlist.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Link href={`/playlists/${playlist.id}`}>
                    <Button size="lg" className="bg-primary/90 hover:bg-primary text-primary-foreground">
                      <Play className="h-6 w-6 mr-2" />
                      View Playlist
                    </Button>
                  </Link>
                </div>

                {/* Drama Count Badge */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {playlist.dramas.length} episodes
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{playlist.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{playlist.description}</p>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="capitalize">{playlist.category.replace("-", " ")}</span>
                  <span>{playlist.dramas.length} dramas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
