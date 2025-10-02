"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, SkipForward, Heart, MessageCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Slider } from "../ui/slider"
import { cn } from "../../lib/utils"
import type { Drama, EmotionalMarker } from "../../lib/types"

interface VideoPlayerProps {
  drama: Drama
  onEnded?: () => void
  emotionalMarkers?: EmotionalMarker[]
  className?: string
}

export function VideoPlayer({ drama, onEnded, emotionalMarkers = [], className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onEnded])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = (value[0] / 100) * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0] / 100
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={cn("relative w-full h-full bg-black group", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full object-cover" poster={drama.thumbnail} onClick={togglePlay}>
        <source src={drama.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Emotional Markers */}
      {emotionalMarkers.map((marker, index) => (
        <div
          key={index}
          className="absolute left-4 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-medium animate-pulse"
          style={{
            top: `${20 + index * 40}px`,
            opacity: Math.abs(currentTime - marker.timestamp) < 5 ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          {marker.emotion} {marker.icon}
        </div>
      ))}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Slider value={[progress]} onValueChange={handleSeek} max={100} step={0.1} className="w-full" />
            <div className="flex justify-between text-xs text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:text-primary">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:text-primary">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-16"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white hover:text-red-400">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-primary">
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-primary">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
