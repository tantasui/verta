"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { VideoPlayer } from "../components/video/video-player"
import { EmotionalReactions } from "../components/video/emotional-reactions"
import { CommentSection } from "../components/video/comment-section"
import { NextUp } from "../components/video/next-up"
import { useDramaStore } from "../lib/store"
import { mockDramas } from "../lib/mock-data"
import type { Drama } from "../lib/types"

export function WatchPage() {
  const [searchParams] = useSearchParams()
  const dramaId = searchParams.get("id")
  const { setCurrentDrama } = useDramaStore()

  const [currentDrama, setCurrentDramaState] = useState<Drama | null>(null)
  const [nextDrama, setNextDrama] = useState<Drama | null>(null)
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (dramaId) {
      const drama = mockDramas.find((d) => d.id === dramaId)
      if (drama) {
        setCurrentDramaState(drama)
        setCurrentDrama(drama)

        // Find next drama
        const currentIndex = mockDramas.findIndex((d) => d.id === dramaId)
        const next = mockDramas[currentIndex + 1] || mockDramas[0]
        setNextDrama(next)
      }
    } else {
      // Default to first drama
      const firstDrama = mockDramas[0]
      setCurrentDramaState(firstDrama)
      setCurrentDrama(firstDrama)
      setNextDrama(mockDramas[1])
    }
  }, [dramaId, setCurrentDrama])

  const handleVideoEnded = () => {
    // Start auto-play countdown
    setAutoPlayCountdown(10)

    const countdown = setInterval(() => {
      setAutoPlayCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdown)
          handlePlayNext()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePlayNext = () => {
    if (nextDrama) {
      setCurrentDramaState(nextDrama)
      setCurrentDrama(nextDrama)

      // Find next after next
      const currentIndex = mockDramas.findIndex((d) => d.id === nextDrama.id)
      const next = mockDramas[currentIndex + 1] || mockDramas[0]
      setNextDrama(next)
      setAutoPlayCountdown(null)
    }
  }

  if (!currentDrama) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <VideoPlayer
            drama={currentDrama}
            onEnded={handleVideoEnded}
            className="w-full max-w-md mx-auto lg:max-w-none"
          />

          {/* Drama Info */}
          <div className="mt-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{currentDrama.title}</h1>
              <p className="text-muted-foreground mb-4">{currentDrama.description}</p>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                <span>{currentDrama.viewCount.toLocaleString()} views</span>
                <span>
                  {Math.floor(currentDrama.duration / 60)}:{(currentDrama.duration % 60).toString().padStart(2, "0")}
                </span>
                <span>{currentDrama.createdAt.toLocaleDateString()}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentDrama.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-accent/20 text-accent-foreground rounded-full capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Up */}
          <NextUp
            nextDrama={nextDrama}
            onPlayNext={handlePlayNext}
            autoPlayCountdown={autoPlayCountdown || undefined}
          />

          {/* Emotional Reactions */}
          <EmotionalReactions dramaId={currentDrama.id} />

          {/* Comments */}
          <CommentSection dramaId={currentDrama.id} />
        </div>
      </div>
    </div>
  )
}
