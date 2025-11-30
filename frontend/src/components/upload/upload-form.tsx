"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, X, Plus, Video, ImageIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ProgressBar } from "./progress-bar"
import { cn } from "../../lib/utils"

interface UploadFormProps {
  onSubmit?: (data: FormData) => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
}

const emotionalTags = [
  "Romantic",
  "Dramatic",
  "Suspenseful",
  "Heartbreaking",
  "Shocking",
  "Inspiring",
  "Mysterious",
  "Comedic",
  "Intense",
  "Emotional",
]

export function UploadForm({ className }: UploadFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[],
    duration: "",
    genre: "",
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [uploadResult, setUploadResult] = useState<any>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleVideoUpload = useCallback((file: File) => {
    if (file.type.startsWith("video/")) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }, [])


  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      const videoFile = files.find((f) => f.type.startsWith("video/"))

      if (videoFile) handleVideoUpload(videoFile)
    },
    [handleVideoUpload],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile || !formData.title || !formData.description) return

    setIsUploading(true)
    setUploadStatus("Preparing video upload...")
    setUploadResult(null)

    const processorUrl = import.meta.env.VITE_PROCESSOR_URL || 'http://localhost:3002'

    const data = new FormData()
    data.append("video", videoFile)
    data.append("title", formData.title)
    data.append("description", formData.description)

    try {
      setUploadStatus("Uploading and processing video...")

      const response = await fetch(`${processorUrl}/api/upload`, {
        method: 'POST',
        body: data
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      setUploadStatus("Upload successful!")
      setUploadResult(result)

      // Reset form
      setTimeout(() => {
        setVideoFile(null)
        setVideoPreview(null)
        setFormData({
          title: "",
          description: "",
          tags: [],
          duration: "",
          genre: "",
        })
      }, 3000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const isFormValid = formData.title && formData.description && videoFile

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Video Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Video Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              videoFile && "border-green-500 bg-green-50 dark:bg-green-950/20",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {videoPreview ? (
              <div className="space-y-4">
                <video src={videoPreview} className="w-full max-w-md mx-auto rounded-lg" controls />
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm font-medium">{videoFile?.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVideoFile(null)
                      setVideoPreview(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your video here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                </div>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleVideoUpload(file)
                  }}
                  className="hidden"
                  id="video-upload"
                />
                <Label htmlFor="video-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose Video File</span>
                  </Button>
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail will be auto-generated */}

      {/* Video Details */}
      <Card>
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter video title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                placeholder="e.g., 15:30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your video..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={formData.genre}
              onChange={(e) => handleInputChange("genre", e.target.value)}
              placeholder="e.g., Romance, Drama, Thriller"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emotional Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Emotional Tags *</CardTitle>
          <p className="text-sm text-muted-foreground">Select tags that describe the emotional tone of your video</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {emotionalTags.map((tag) => (
              <Badge
                key={tag}
                variant={formData.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => handleTagToggle(tag)}
              >
                {formData.tags.includes(tag) && <Plus className="w-3 h-3 mr-1 rotate-45" />}
                {tag}
              </Badge>
            ))}
          </div>
          {formData.tags.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">Selected: {formData.tags.join(", ")}</p>
          )}
        </CardContent>
      </Card>

      {/* Upload Status */}
      {(isUploading || uploadStatus) && (
        <Card>
          <CardContent className="pt-6">
            {isUploading && <ProgressBar progress={50} />}
            <p className="text-sm text-center text-muted-foreground mt-2">{uploadStatus}</p>
            {uploadResult && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Video uploaded successfully!</p>
                <div className="mt-2 text-xs text-green-800 dark:text-green-200 space-y-1">
                  <p>Video ID: {uploadResult.videoId}</p>
                  <p>Chunks: {uploadResult.chunkCount}</p>
                  <p>Duration: {Math.round(uploadResult.duration)}s</p>
                  <p className="font-mono text-xs truncate">Tx: {uploadResult.txDigest}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button type="submit" disabled={!isFormValid || isUploading} className="min-w-32">
          {isUploading ? "Uploading..." : "Publish Video"}
        </Button>
      </div>
    </form>
  )
}
